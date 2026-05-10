from __future__ import annotations

import json
from typing import Any

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from sqlalchemy import text

from app.database import engine
from app.resume_services.ai_resume_analyzer import analyze_resume_with_ai
from app.resume_services.resume_parser import UnsupportedResumeFormat, extract_resume_text

router = APIRouter(prefix="/resume", tags=["Resume Analysis"])

MIN_TEXT_CHARS = (
    20  # heuristic: avoids saving empty/low-signal OCR failures as full analyses
)


@router.get("/")
def test_resume_route() -> dict[str, str]:
    return {"message": "Resume Route Working"}


@router.post("/analyze")
async def analyze_resume(resume: UploadFile = File(...)) -> dict[str, Any]:
    if not resume.filename:
        raise HTTPException(
            status_code=400,
            detail={"message": "Missing filename; send a PDF or DOCX resume."},
        )

    try:
        text_data = await extract_resume_text(resume)
    except UnsupportedResumeFormat as e:
        raise HTTPException(
            status_code=415,
            detail={
                "message": "Unsupported file type.",
                "allowed": sorted({"pdf", "docx"}),
                "received": e.extension or "unknown",
            },
        )

    stripped = text_data.strip()
    if len(stripped) < MIN_TEXT_CHARS:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Too little text extracted from resume. "
                "Check the file format or try another export.",
                "extracted_character_count": len(stripped),
            },
        )

    ai_response = await analyze_resume_with_ai(stripped)

    try:
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO resume_analysis
                      (file_name, extracted_text, ai_analysis)
                    VALUES (:file_name, :extracted_text, :ai_analysis)
                    """
                ),
                {
                    "file_name": resume.filename,
                    "extracted_text": stripped,
                    "ai_analysis": json.dumps(ai_response),
                },
            )
            row = connection.execute(
                text("SELECT LAST_INSERT_ID() AS analysis_id")
            ).first()
            analysis_id = int(row[0])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Saving resume analysis failed. "
                "Confirm table resume_analysis exists (see README / schema_extensions.sql).",
                "error": str(e),
            },
        )

    return {
        "success": True,
        "analysis_id": analysis_id,
        "file_name": resume.filename,
        "ai_analysis": ai_response,
    }


@router.get("/analyses")
def list_resume_analyses(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    include_ai_preview: bool = Query(
        default=True,
        description="If true, parses stored JSON so the UI can render cards without fetching each row.",
    ),
) -> dict[str, Any]:
    try:
        with engine.connect() as connection:
            rows = (
                connection.execute(
                    text(
                        """
                        SELECT analysis_id, file_name, created_at, ai_analysis
                        FROM resume_analysis
                        ORDER BY analysis_id DESC
                        LIMIT :limit OFFSET :offset
                        """
                    ),
                    {"limit": limit, "offset": offset},
                )
                .mappings()
                .all()
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to list analyses", "error": str(e)},
        )

    items: list[dict[str, Any]] = []
    for r in rows:
        entry: dict[str, Any] = {
            "analysis_id": r["analysis_id"],
            "file_name": r["file_name"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        if include_ai_preview and r["ai_analysis"]:
            try:
                entry["ai_analysis"] = json.loads(r["ai_analysis"])
            except json.JSONDecodeError:
                entry["ai_analysis"] = None
                entry["ai_analysis_parse_error"] = True
        items.append(entry)

    return {"success": True, "count": len(items), "items": items}


@router.delete("/analyses/{analysis_id}")
def delete_resume_analysis(analysis_id: int) -> dict[str, Any]:
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("DELETE FROM resume_analysis WHERE analysis_id = :aid"),
                {"aid": analysis_id},
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to delete analysis", "error": str(e)},
        )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {"success": True, "deleted_id": analysis_id}


@router.get("/analyses/{analysis_id}")
def get_resume_analysis(analysis_id: int) -> dict[str, Any]:
    try:
        with engine.connect() as connection:
            row = connection.execute(
                text(
                    """
                    SELECT analysis_id, file_name, extracted_text, ai_analysis, created_at
                    FROM resume_analysis
                    WHERE analysis_id = :aid
                    """
                ),
                {"aid": analysis_id},
            ).mappings().first()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to load analysis", "error": str(e)},
        )

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    try:
        parsed_ai = json.loads(row["ai_analysis"])
    except json.JSONDecodeError:
        parsed_ai = None

    return {
        "success": True,
        "analysis_id": row["analysis_id"],
        "file_name": row["file_name"],
        "extracted_text": row["extracted_text"],
        "ai_analysis": parsed_ai,
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }
