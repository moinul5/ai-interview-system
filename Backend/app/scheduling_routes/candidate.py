"""
scheduling_routes/candidate.py
-------------------------------
Candidate-facing endpoints for human interview scheduling.
All endpoints require the 'candidate' role.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.auth.dependencies import require_candidate
from app.database import engine
from app.notification_routes.notification_service import (
    create_notification,
    notify_slot_selected,
)

router = APIRouter(prefix="/candidate", tags=["Candidate - Scheduling"])


# ── Request schemas ───────────────────────────────────────────────────────────


class SelectSlotRequest(BaseModel):
    availability_id: Optional[int] = None
    slot_id: Optional[int] = None  # fallback for frontend
    message: Optional[str] = None


class RescheduleRequest(BaseModel):
    message: str


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_candidate_id(user_id: int) -> int:
    """Look up candidate_id from the candidates table using user_id. Creates one if missing."""
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT candidate_id FROM candidates WHERE user_id = :uid"),
            {"uid": user_id},
        ).mappings().first()
        
        if not row:
            conn.execute(
                text("INSERT INTO candidates (user_id) VALUES (:uid)"),
                {"uid": user_id}
            )
            row = conn.execute(
                text("SELECT candidate_id FROM candidates WHERE user_id = :uid"),
                {"uid": user_id}
            ).mappings().first()
            
    return int(row["candidate_id"])


def _serialize_row(row: dict) -> dict:
    out = dict(row)
    for key, val in out.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/interviews")
def list_candidate_interviews(user: dict = Depends(require_candidate)):
    """List the candidate's human interviews with interviewer and position info."""
    candidate_id = _get_candidate_id(user["user_id"])

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT iv.interview_id AS id, iv.status, iv.interview_type,
                       iv.duration_minutes, iv.timezone, iv.interview_round AS round,
                       iv.meeting_link AS meet_link, iv.total_score AS score,
                       iv.interview_date AS scheduled_at,
                       iv.created_at, iv.confirmed_at,
                       u_i.name AS interviewer_name, u_i.email AS interviewer_email,
                       i.expertise AS interviewer_specialization,
                       jp.title AS position_title, jp.description AS position_description
                FROM interviews iv
                LEFT JOIN interviewers i ON i.interviewer_id = iv.interviewer_id
                LEFT JOIN users u_i ON u_i.user_id = i.user_id
                LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
                WHERE iv.candidate_id = :cid
                ORDER BY iv.created_at DESC
                """
            ),
            {"cid": candidate_id},
        ).mappings().all()

    return [_serialize_row(r) for r in rows]


@router.get("/interviews/{interview_id}/slots")
def get_available_slots(interview_id: int, user: dict = Depends(require_candidate)):
    """Get available (unbooked) time slots from the assigned interviewer's availability."""
    candidate_id = _get_candidate_id(user["user_id"])

    with engine.connect() as conn:
        # Verify the interview belongs to this candidate and fetch its details
        iv = conn.execute(
            text(
                """
                SELECT iv.interview_id, iv.interviewer_id, iv.status, iv.interview_type,
                       u_i.name AS interviewer_name,
                       jp.title AS position_title
                FROM interviews iv
                LEFT JOIN interviewers i ON i.interviewer_id = iv.interviewer_id
                LEFT JOIN users u_i ON u_i.user_id = i.user_id
                LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
                WHERE iv.interview_id = :iid AND iv.candidate_id = :cid
                """
            ),
            {"iid": interview_id, "cid": candidate_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or does not belong to you",
            )

        # Fetch unbooked availability for the interviewer
        slots = conn.execute(
            text(
                """
                SELECT availability_id AS id, interviewer_id, start_time, end_time,
                       is_booked, created_at
                FROM interviewer_availability
                WHERE interviewer_id = :interviewer_id
                  AND is_booked = 0
                  AND start_time > NOW()
                ORDER BY start_time ASC
                """
            ),
            {"interviewer_id": iv["interviewer_id"]},
        ).mappings().all()

    return {
        "slots": [_serialize_row(s) for s in slots],
        "interview": _serialize_row(iv) if iv else None,
    }


@router.post("/interviews/{interview_id}/select-slot")
def select_slot(
    interview_id: int,
    body: SelectSlotRequest,
    user: dict = Depends(require_candidate),
):
    """Select a time slot for the interview. Creates a schedule request and notifies the interviewer."""
    candidate_id = _get_candidate_id(user["user_id"])

    # Extract selected availability/slot ID
    aid = body.availability_id if body.availability_id is not None else body.slot_id
    if aid is None:
        raise HTTPException(
            status_code=422,
            detail="Either availability_id or slot_id must be provided",
        )

    with engine.begin() as conn:
        # Verify interview ownership and status
        iv = conn.execute(
            text(
                """
                SELECT interview_id, interviewer_id, status
                FROM interviews
                WHERE interview_id = :iid AND candidate_id = :cid
                """
            ),
            {"iid": interview_id, "cid": candidate_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or does not belong to you",
            )

        if iv["status"] not in ("pending", "reschedule_requested"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot select slot — interview status is '{iv['status']}'",
            )

        # Verify slot exists, is unbooked, and belongs to the interviewer
        slot = conn.execute(
            text(
                """
                SELECT availability_id, interviewer_id, start_time, end_time, is_booked
                FROM interviewer_availability
                WHERE availability_id = :aid AND interviewer_id = :interviewer_id
                """
            ),
            {"aid": aid, "interviewer_id": iv["interviewer_id"]},
        ).mappings().first()

        if not slot:
            raise HTTPException(status_code=404, detail="Availability slot not found")
        if slot["is_booked"]:
            raise HTTPException(status_code=409, detail="This slot is already booked")

        # Create schedule request
        conn.execute(
            text(
                """
                INSERT INTO interview_schedule_requests
                    (interview_id, availability_id, candidate_id, interviewer_id, status, message, created_at)
                VALUES
                    (:iid, :aid, :cid, :interviewer_id, 'candidate_selected', :message, :now)
                """
            ),
            {
                "iid": interview_id,
                "aid": aid,
                "cid": candidate_id,
                "interviewer_id": iv["interviewer_id"],
                "message": body.message,
                "now": datetime.now(timezone.utc),
            },
        )

        # Update interview status
        conn.execute(
            text("UPDATE interviews SET status = 'time_selected' WHERE interview_id = :iid"),
            {"iid": interview_id},
        )

        # Mark slot as booked
        conn.execute(
            text(
                "UPDATE interviewer_availability SET is_booked = 1 WHERE availability_id = :aid"
            ),
            {"aid": aid},
        )

    # Notify interviewer
    # Look up interviewer user_id
    with engine.connect() as conn:
        interviewer = conn.execute(
            text("SELECT user_id FROM interviewers WHERE interviewer_id = :iid"),
            {"iid": iv["interviewer_id"]},
        ).mappings().first()

    if interviewer:
        slot_time = slot["start_time"].isoformat() if slot["start_time"] else "TBD"
        notify_slot_selected(
            interview_id=interview_id,
            interviewer_user_id=interviewer["user_id"],
            candidate_name=user["name"],
            slot_time=slot_time,
        )

    return {"message": "Time slot selected. Waiting for interviewer confirmation."}


@router.post("/interviews/{interview_id}/reschedule")
def request_reschedule(
    interview_id: int,
    body: RescheduleRequest,
    user: dict = Depends(require_candidate),
):
    """Request a reschedule for an interview."""
    candidate_id = _get_candidate_id(user["user_id"])

    with engine.begin() as conn:
        iv = conn.execute(
            text(
                """
                SELECT interview_id, interviewer_id, status
                FROM interviews
                WHERE interview_id = :iid AND candidate_id = :cid
                """
            ),
            {"iid": interview_id, "cid": candidate_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or does not belong to you",
            )

        if iv["status"] in ("completed", "cancelled"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reschedule — interview is '{iv['status']}'",
            )

        conn.execute(
            text(
                "UPDATE interviews SET status = 'reschedule_requested' WHERE interview_id = :iid"
            ),
            {"iid": interview_id},
        )

    # Notify interviewer and admin
    with engine.connect() as conn:
        interviewer = conn.execute(
            text("SELECT user_id FROM interviewers WHERE interviewer_id = :iid"),
            {"iid": iv["interviewer_id"]},
        ).mappings().first()

        admins = conn.execute(
            text("SELECT user_id FROM users WHERE role = 'admin'")
        ).mappings().all()

    if interviewer:
        create_notification(
            user_id=interviewer["user_id"],
            title="Reschedule Requested",
            message=(
                f"{user['name']} has requested to reschedule interview ID: {interview_id}. "
                f"Reason: {body.message}"
            ),
        )
    for a in admins:
        create_notification(
            user_id=a["user_id"],
            title="Reschedule Requested",
            message=(
                f"Candidate {user['name']} requested to reschedule interview ID: {interview_id}. "
                f"Reason: {body.message}"
            ),
        )

    return {"message": "Reschedule request submitted"}
