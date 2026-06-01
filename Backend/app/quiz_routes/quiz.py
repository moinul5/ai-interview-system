from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text

from app.database import engine

router = APIRouter(prefix="/quiz", tags=["Aptitude Quiz"])


class QuizQuestionsResponse(BaseModel):
    questions: list[dict[str, Any]]


class QuizSubmitRequest(BaseModel):
    """Answers key: quiz question id (string or number in JSON) -> A/B/C/D."""

    answers: dict[str | int, str] = Field(default_factory=dict)
    user_id: int | None = Field(
        default=None,
        description="Optional FK into users.user_id when auth exists",
    )


class QuizSubmitResponse(BaseModel):
    success: bool
    submission_id: int
    score_obtained: int
    max_score: int
    percentage: float


@router.get("/questions", response_model=QuizQuestionsResponse)
def list_quiz_questions(limit: int = 10) -> QuizQuestionsResponse:
    lim = max(1, min(limit, 50))
    with engine.connect() as conn:
        rows = (
            conn.execute(
                text(
                    """
                    SELECT quiz_question_id, question_text,
                           option_a, option_b, option_c, option_d, marks
                    FROM aptitude_quiz_questions
                    ORDER BY quiz_question_id
                    LIMIT :lim
                    """
                ),
                {"lim": lim},
            )
            .mappings()
            .all()
        )
    payload = []
    for r in rows:
        payload.append(
            {
                "question_id": r["quiz_question_id"],
                "question_text": r["question_text"],
                "options": {
                    "A": r["option_a"],
                    "B": r["option_b"],
                    "C": r["option_c"],
                    "D": r["option_d"],
                },
                "marks": r["marks"],
            }
        )
    return QuizQuestionsResponse(questions=payload)


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(body: QuizSubmitRequest) -> QuizSubmitResponse:
    if not body.answers:
        raise HTTPException(
            status_code=400, detail={"message": "'answers' must not be empty"}
        )

    norm: dict[int, str] = {}
    for k, raw in body.answers.items():
        try:
            qid = int(k)
        except (TypeError, ValueError) as e:
            raise HTTPException(
                status_code=422,
                detail={"message": f"Invalid question id key: {k!r}", "hint": str(e)},
            )
        sel = raw.strip().upper()
        if sel not in ("A", "B", "C", "D"):
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Option for question {qid} must be A, B, C, or D",
                    "received": raw,
                },
            )
        norm[qid] = sel

    ids = tuple(sorted(norm.keys()))
    stmt = text(
        """
        SELECT quiz_question_id, correct_option, marks
        FROM aptitude_quiz_questions
        WHERE quiz_question_id IN :ids
        """
    ).bindparams(bindparam("ids", expanding=True))

    try:
        with engine.begin() as conn:
            rows = conn.execute(stmt, {"ids": list(ids)}).mappings().all()
            if len(rows) != len(ids):
                found = {r["quiz_question_id"] for r in rows}
                missing = set(ids) - found
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Some question IDs are invalid",
                        "missing_question_ids": sorted(missing),
                    },
                )

            max_score = sum(int(r["marks"]) for r in rows)
            score_obtained = sum(
                int(r["marks"])
                for r in rows
                if norm[int(r["quiz_question_id"])]
                == r["correct_option"].upper()
            )

            ans_json = json.dumps({str(k): v for k, v in norm.items()})

            conn.execute(
                text(
                    """
                    INSERT INTO aptitude_quiz_submissions
                      (user_id, score_obtained, max_score, answers_json)
                    VALUES (:user_id, :score_obtained, :max_score, :answers_json)
                    """
                ),
                {
                    "user_id": body.user_id,
                    "score_obtained": score_obtained,
                    "max_score": max_score,
                    "answers_json": ans_json,
                },
            )
            submission_id_raw = conn.execute(
                text("SELECT LAST_INSERT_ID() AS submission_id")
            ).scalar_one()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to persist quiz submission", "error": str(e)},
        )

    submission_id = int(submission_id_raw)
    pct = (100.0 * score_obtained / max_score) if max_score else 0.0
    return QuizSubmitResponse(
        success=True,
        submission_id=submission_id,
        score_obtained=score_obtained,
        max_score=max_score,
        percentage=round(pct, 2),
    )


class QuizSubmissionSummary(BaseModel):
    submission_id: int
    user_id: int | None
    score_obtained: int
    max_score: int
    percentage: float
    created_at: str | None


@router.get("/submissions/{submission_id}", response_model=QuizSubmissionSummary)
def get_submission(submission_id: int) -> QuizSubmissionSummary:
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT submission_id, user_id, score_obtained, max_score,
                       created_at
                FROM aptitude_quiz_submissions
                WHERE submission_id = :sid
                """
            ),
            {"sid": submission_id},
        ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
    mx = int(row["max_score"])
    sc = int(row["score_obtained"])
    pct = (100.0 * sc / mx) if mx else 0.0
    created = row["created_at"]
    return QuizSubmissionSummary(
        submission_id=int(row["submission_id"]),
        user_id=row["user_id"],
        score_obtained=sc,
        max_score=mx,
        percentage=round(pct, 2),
        created_at=created.isoformat() if created else None,
    )
