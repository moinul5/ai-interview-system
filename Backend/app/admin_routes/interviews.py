"""
admin_routes/interviews.py
---------------------------
Admin endpoints for interview management.
All endpoints require the 'admin' role.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from app.auth.dependencies import require_admin
from app.database import engine
from app.notification_routes.notification_service import notify_interview_created

router = APIRouter(prefix="/admin/interviews", tags=["Admin - Interviews"])


# ── Request schemas ───────────────────────────────────────────────────────────


class CreateInterviewRequest(BaseModel):
    candidate_id: int
    interviewer_id: int
    position_id: Optional[int] = None
    interview_type: str = "human"
    duration_minutes: int = 60
    timezone: str = "UTC"
    interview_round: int = 1


class AssignRequest(BaseModel):
    interviewer_id: Optional[int] = None
    candidate_id: Optional[int] = None


class StatusUpdateRequest(BaseModel):
    status: str  # pending, confirmed, cancelled, completed, reschedule_requested
    reason: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _serialize_row(row: dict) -> dict:
    out = dict(row)
    for key, val in out.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("")
def list_interviews(
    status_filter: Optional[str] = None,
    interview_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(require_admin),
):
    """List all interviews with filters (status, type, date range)."""
    query = """
        SELECT iv.interview_id AS id, iv.candidate_id, iv.interviewer_id,
               iv.position_id, iv.interview_type, iv.status,
               iv.duration_minutes, iv.timezone, iv.interview_round AS round,
               iv.meeting_link AS meet_link, iv.total_score AS score,
               iv.interview_date AS scheduled_at,
               iv.created_at, iv.confirmed_at,
               u_c.name AS candidate_name, u_c.email AS candidate_email,
               u_i.name AS interviewer_name, u_i.email AS interviewer_email,
               jp.title AS position_title
        FROM interviews iv
        LEFT JOIN candidates c ON c.candidate_id = iv.candidate_id
        LEFT JOIN users u_c ON u_c.user_id = c.user_id
        LEFT JOIN interviewers i ON i.interviewer_id = iv.interviewer_id
        LEFT JOIN users u_i ON u_i.user_id = i.user_id
        LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
        WHERE 1=1
    """
    params: dict = {"limit": min(limit, 200), "skip": skip}

    if status_filter:
        query += " AND iv.status = :status"
        params["status"] = status_filter
    if interview_type:
        query += " AND iv.interview_type = :itype"
        params["itype"] = interview_type
    if date_from:
        query += " AND iv.created_at >= :date_from"
        params["date_from"] = date_from
    if date_to:
        query += " AND iv.created_at <= :date_to"
        params["date_to"] = date_to

    query += " ORDER BY iv.created_at DESC LIMIT :limit OFFSET :skip"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).mappings().all()

    return [_serialize_row(r) for r in rows]


@router.get("/{interview_id}")
def get_interview(interview_id: int, admin: dict = Depends(require_admin)):
    """Get full interview details including schedule requests and feedback."""
    with engine.connect() as conn:
        iv = conn.execute(
            text(
                """
                SELECT iv.*, 
                       iv.interview_id AS id,
                       iv.interview_round AS round,
                       iv.meeting_link AS meet_link,
                       iv.total_score AS score,
                       iv.interview_date AS scheduled_at,
                       u_c.name AS candidate_name, u_c.email AS candidate_email,
                       u_i.name AS interviewer_name, u_i.email AS interviewer_email,
                       jp.title AS position_title
                FROM interviews iv
                LEFT JOIN candidates c ON c.candidate_id = iv.candidate_id
                LEFT JOIN users u_c ON u_c.user_id = c.user_id
                LEFT JOIN interviewers i ON i.interviewer_id = iv.interviewer_id
                LEFT JOIN users u_i ON u_i.user_id = i.user_id
                LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
                WHERE iv.interview_id = :iid
                """
            ),
            {"iid": interview_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Schedule requests
        schedule_requests = conn.execute(
            text(
                """
                SELECT * FROM interview_schedule_requests
                WHERE interview_id = :iid
                ORDER BY created_at DESC
                """
            ),
            {"iid": interview_id},
        ).mappings().all()

        # Feedback
        feedback = conn.execute(
            text(
                """
                SELECT * FROM interviewer_feedback
                WHERE interview_id = :iid
                ORDER BY created_at DESC
                """
            ),
            {"iid": interview_id},
        ).mappings().all()

    result = _serialize_row(iv)
    result["schedule_requests"] = [_serialize_row(sr) for sr in schedule_requests]
    result["feedback"] = [_serialize_row(fb) for fb in feedback]
    return result


@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_interview(body: CreateInterviewRequest, admin: dict = Depends(require_admin)):
    """Create a new interview assignment. Notifies candidate and interviewer."""
    with engine.begin() as conn:
        # Validate candidate exists
        candidate = conn.execute(
            text("SELECT candidate_id, user_id FROM candidates WHERE candidate_id = :cid"),
            {"cid": body.candidate_id},
        ).mappings().first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Validate interviewer exists
        interviewer = conn.execute(
            text("SELECT interviewer_id, user_id FROM interviewers WHERE interviewer_id = :iid"),
            {"iid": body.interviewer_id},
        ).mappings().first()
        if not interviewer:
            raise HTTPException(status_code=404, detail="Interviewer not found")

        # Validate position if provided
        if body.position_id:
            pos = conn.execute(
                text("SELECT position_id FROM job_positions WHERE position_id = :pid"),
                {"pid": body.position_id},
            ).mappings().first()
            if not pos:
                raise HTTPException(status_code=404, detail="Job position not found")

        conn.execute(
            text(
                """
                INSERT INTO interviews
                    (candidate_id, interviewer_id, position_id, interview_type,
                     status, duration_minutes, timezone, interview_round, created_at)
                VALUES
                    (:candidate_id, :interviewer_id, :position_id, :interview_type,
                     'pending', :duration_minutes, :timezone, :interview_round, :created_at)
                """
            ),
            {
                "candidate_id": body.candidate_id,
                "interviewer_id": body.interviewer_id,
                "position_id": body.position_id,
                "interview_type": body.interview_type,
                "duration_minutes": body.duration_minutes,
                "timezone": body.timezone,
                "interview_round": body.interview_round,
                "created_at": datetime.now(timezone.utc),
            },
        )
        new_id = int(
            conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()
        )

    # Send notifications (outside transaction so interview still commits on failure)
    notify_interview_created(new_id, candidate["user_id"], interviewer["user_id"])

    return {"message": "Interview created successfully", "interview_id": new_id}


@router.patch("/{interview_id}/assign")
def assign_interview(
    interview_id: int, body: AssignRequest, admin: dict = Depends(require_admin)
):
    """Reassign interviewer or candidate for an interview."""
    sets = []
    params: dict = {"iid": interview_id}

    if body.interviewer_id is not None:
        sets.append("interviewer_id = :interviewer_id")
        params["interviewer_id"] = body.interviewer_id
    if body.candidate_id is not None:
        sets.append("candidate_id = :candidate_id")
        params["candidate_id"] = body.candidate_id

    if not sets:
        raise HTTPException(status_code=400, detail="No assignment fields provided")

    with engine.begin() as conn:
        result = conn.execute(
            text(
                f"UPDATE interviews SET {', '.join(sets)} WHERE interview_id = :iid"
            ),
            params,
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Interview not found")

    return {"message": "Interview assignment updated"}


@router.patch("/{interview_id}/status")
def update_status(
    interview_id: int,
    body: StatusUpdateRequest,
    admin: dict = Depends(require_admin),
):
    """Change interview status (cancel, force reschedule, etc.)."""
    valid_statuses = {
        "pending", "time_selected", "confirmed", "completed",
        "cancelled", "reschedule_requested",
    }
    if body.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {sorted(valid_statuses)}",
        )

    with engine.begin() as conn:
        result = conn.execute(
            text(
                "UPDATE interviews SET status = :status WHERE interview_id = :iid"
            ),
            {"status": body.status, "iid": interview_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Interview not found")

    return {"message": f"Interview status updated to '{body.status}'"}


@router.delete("/{interview_id}")
def delete_interview(interview_id: int, admin: dict = Depends(require_admin)):
    """Cancel and delete an interview."""
    with engine.begin() as conn:
        # Delete related schedule requests first
        conn.execute(
            text("DELETE FROM interview_schedule_requests WHERE interview_id = :iid"),
            {"iid": interview_id},
        )
        # Delete related feedback
        conn.execute(
            text("DELETE FROM interviewer_feedback WHERE interview_id = :iid"),
            {"iid": interview_id},
        )
        result = conn.execute(
            text("DELETE FROM interviews WHERE interview_id = :iid"),
            {"iid": interview_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Interview not found")

    return {"message": "Interview deleted successfully"}
