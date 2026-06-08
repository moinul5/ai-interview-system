"""
admin_routes/jobs.py
--------------------
Admin endpoints for job position management.
All endpoints require the 'admin' role.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from app.auth.dependencies import require_admin
from app.database import engine

router = APIRouter(prefix="/admin/jobs", tags=["Admin - Jobs"])


# ── Request schemas ───────────────────────────────────────────────────────────


class CreateJobRequest(BaseModel):
    title: str
    description: Optional[str] = None
    required_experience: Optional[int] = None
    status: str = "open"  # open | closed


class UpdateJobRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_experience: Optional[int] = None
    status: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _serialize_row(row: dict) -> dict:
    out = dict(row)
    if "position_id" in out:
        out["id"] = out["position_id"]
    for key, val in out.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("")
def list_jobs(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(require_admin),
):
    """List all job positions with optional status filter."""
    query = "SELECT * FROM job_positions WHERE 1=1"
    params: dict = {"limit": min(limit, 200), "skip": skip}

    if status_filter:
        query += " AND status = :status"
        params["status"] = status_filter

    query += " ORDER BY position_id DESC LIMIT :limit OFFSET :skip"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).mappings().all()

    return [_serialize_row(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(body: CreateJobRequest, admin: dict = Depends(require_admin)):
    """Create a new job position."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO job_positions (title, description, required_experience, status)
                VALUES (:title, :description, :required_experience, :status)
                """
            ),
            {
                "title": body.title,
                "description": body.description,
                "required_experience": body.required_experience,
                "status": body.status,
            },
        )
        new_id = int(
            conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()
        )

    return {"message": "Job position created", "position_id": new_id}


@router.patch("/{position_id}")
def update_job(
    position_id: int, body: UpdateJobRequest, admin: dict = Depends(require_admin)
):
    """Update a job position."""
    sets = []
    params: dict = {"pid": position_id}

    if body.title is not None:
        sets.append("title = :title")
        params["title"] = body.title
    if body.description is not None:
        sets.append("description = :description")
        params["description"] = body.description
    if body.required_experience is not None:
        sets.append("required_experience = :required_experience")
        params["required_experience"] = body.required_experience
    if body.status is not None:
        sets.append("status = :status")
        params["status"] = body.status

    if not sets:
        raise HTTPException(status_code=400, detail="No fields to update")

    with engine.begin() as conn:
        result = conn.execute(
            text(f"UPDATE job_positions SET {', '.join(sets)} WHERE position_id = :pid"),
            params,
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Job position not found")

    return {"message": "Job position updated"}


@router.delete("/{position_id}")
def delete_job(position_id: int, admin: dict = Depends(require_admin)):
    """Close / delete a job position."""
    with engine.begin() as conn:
        result = conn.execute(
            text("DELETE FROM job_positions WHERE position_id = :pid"),
            {"pid": position_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Job position not found")

    return {"message": "Job position deleted"}
