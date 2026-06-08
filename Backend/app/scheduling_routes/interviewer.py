"""
scheduling_routes/interviewer.py
---------------------------------
Interviewer-facing endpoints for availability, interview management, and feedback.
All endpoints require the 'interviewer' role.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from app.auth.dependencies import require_interviewer
from app.database import engine
from app.notification_routes.notification_service import (
    notify_interview_accepted,
    notify_interview_rejected,
)

router = APIRouter(prefix="/interviewer", tags=["Interviewer - Management"])

GOOGLE_MEET_LINK = "https://meet.google.com/oim-jhdn-eue"


# ── Request schemas ───────────────────────────────────────────────────────────


class AvailabilitySlot(BaseModel):
    start_time: str  # ISO format
    end_time: str  # ISO format


class CreateAvailabilityRequest(BaseModel):
    slots: Optional[List[AvailabilitySlot]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str


class FeedbackRequest(BaseModel):
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    problem_solving_score: Optional[float] = None
    overall_score: float
    recommendation: Optional[str] = None  # hire, no_hire, maybe
    notes: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_interviewer_id(user_id: int) -> int:
    """Look up interviewer_id from the interviewers table using user_id. Creates one if missing."""
    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT interviewer_id FROM interviewers WHERE user_id = :uid"),
            {"uid": user_id},
        ).mappings().first()
        
        if not row:
            conn.execute(
                text("INSERT INTO interviewers (user_id) VALUES (:uid)"),
                {"uid": user_id}
            )
            row = conn.execute(
                text("SELECT interviewer_id FROM interviewers WHERE user_id = :uid"),
                {"uid": user_id}
).mappings().first()
            
    return int(row["interviewer_id"])


def _serialize_row(row: dict) -> dict:
    out = dict(row)
    for key, val in out.items():
        if isinstance(val, datetime):
            out[key] = val.isoformat()
    return out


# ── Availability endpoints ────────────────────────────────────────────────────


@router.get("/availability")
def list_availability(user: dict = Depends(require_interviewer)):
    """List own availability slots."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT availability_id AS id, interviewer_id, start_time, end_time,
                       is_booked, created_at
                FROM interviewer_availability
                WHERE interviewer_id = :iid
                ORDER BY start_time ASC
                """
            ),
            {"iid": interviewer_id},
        ).mappings().all()

    return [_serialize_row(r) for r in rows]


@router.post("/availability", status_code=status.HTTP_201_CREATED)
def create_availability(
    body: CreateAvailabilityRequest, user: dict = Depends(require_interviewer)
):
    """Create one or more availability slots. Validates no overlapping slots."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    slots_to_process = []
    if body.slots:
        slots_to_process = body.slots
    elif body.start_time and body.end_time:
        slots_to_process = [AvailabilitySlot(start_time=body.start_time, end_time=body.end_time)]
    else:
        raise HTTPException(
            status_code=400,
            detail="Either 'slots' list or both 'start_time' and 'end_time' must be provided",
        )

    created_ids = []

    with engine.begin() as conn:
        for slot in slots_to_process:
            try:
                start = datetime.fromisoformat(slot.start_time)
                end = datetime.fromisoformat(slot.end_time)
            except ValueError:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid datetime format: {slot.start_time} / {slot.end_time}",
                )

            if end <= start:
                raise HTTPException(
                    status_code=400,
                    detail="end_time must be after start_time",
                )

            # Check for overlapping slots
            overlap = conn.execute(
                text(
                    """
                    SELECT availability_id FROM interviewer_availability
                    WHERE interviewer_id = :iid
                      AND start_time < :end_time
                      AND end_time > :start_time
                    """
                ),
                {
                    "iid": interviewer_id,
                    "start_time": start,
                    "end_time": end,
                },
            ).mappings().first()

            if overlap:
                raise HTTPException(
                    status_code=409,
                    detail=f"Slot {slot.start_time} – {slot.end_time} overlaps with existing availability (ID: {overlap['availability_id']})",
                )

            conn.execute(
                text(
                    """
                    INSERT INTO interviewer_availability
                        (interviewer_id, start_time, end_time, is_booked, created_at)
                    VALUES
                        (:iid, :start_time, :end_time, 0, :now)
                    """
                ),
                {
                    "iid": interviewer_id,
                    "start_time": start,
                    "end_time": end,
                    "now": datetime.now(timezone.utc),
                },
            )
            new_id = int(
                conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()
            )
            created_ids.append(new_id)

    return {
        "message": f"{len(created_ids)} availability slot(s) created",
        "availability_ids": created_ids,
    }


@router.delete("/availability/{availability_id}")
def delete_availability(
    availability_id: int, user: dict = Depends(require_interviewer)
):
    """Delete an availability slot (only if not booked)."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.begin() as conn:
        slot = conn.execute(
            text(
                """
                SELECT availability_id, is_booked
                FROM interviewer_availability
                WHERE availability_id = :aid AND interviewer_id = :iid
                """
            ),
            {"aid": availability_id, "iid": interviewer_id},
        ).mappings().first()

        if not slot:
            raise HTTPException(status_code=404, detail="Availability slot not found")
        if slot["is_booked"]:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete a booked slot. Reject the interview first.",
            )

        conn.execute(
            text("DELETE FROM interviewer_availability WHERE availability_id = :aid"),
            {"aid": availability_id},
        )

    return {"message": "Availability slot deleted"}


# ── Interview management endpoints ────────────────────────────────────────────


@router.get("/interviews")
def list_interviews(user: dict = Depends(require_interviewer)):
    """List all interviews assigned to this interviewer."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT iv.interview_id AS id, iv.status, iv.interview_type,
                       iv.duration_minutes, iv.timezone, iv.interview_round AS round,
                       iv.meeting_link AS meet_link, iv.total_score AS score,
                       iv.interview_date AS scheduled_at,
                       iv.created_at, iv.confirmed_at,
                       u_c.name AS candidate_name, u_c.email AS candidate_email,
                       jp.title AS position_title,
                       (SELECT message FROM interview_schedule_requests 
                        WHERE interview_id = iv.interview_id 
                          AND status = 'candidate_selected' 
                        ORDER BY created_at DESC LIMIT 1) AS candidate_message
                FROM interviews iv
                LEFT JOIN candidates c ON c.candidate_id = iv.candidate_id
                LEFT JOIN users u_c ON u_c.user_id = c.user_id
                LEFT JOIN job_positions jp ON jp.position_id = iv.position_id
                WHERE iv.interviewer_id = :iid
                ORDER BY iv.created_at DESC
                """
            ),
            {"iid": interviewer_id},
        ).mappings().all()

    return [_serialize_row(r) for r in rows]


@router.patch("/interviews/{interview_id}/accept")
def accept_interview(interview_id: int, user: dict = Depends(require_interviewer)):
    """Accept interview — confirms the schedule, sets meeting link, notifies candidate."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.begin() as conn:
        iv = conn.execute(
            text(
                """
                SELECT iv.interview_id, iv.status, iv.candidate_id, c.user_id AS candidate_user_id
                FROM interviews iv
                JOIN candidates c ON c.candidate_id = iv.candidate_id
                WHERE iv.interview_id = :iid AND iv.interviewer_id = :interviewer_id
                """
            ),
            {"iid": interview_id, "interviewer_id": interviewer_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or not assigned to you",
            )

        if iv["status"] != "time_selected":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot accept — interview status is '{iv['status']}' (expected 'time_selected')",
            )

        now = datetime.now(timezone.utc)

        # Get the start_time from the selected slot request
        slot_row = conn.execute(
            text(
                """
                SELECT ia.start_time
                FROM interview_schedule_requests isr
                JOIN interviewer_availability ia ON ia.availability_id = isr.availability_id
                WHERE isr.interview_id = :iid AND isr.status = 'candidate_selected'
                ORDER BY isr.created_at DESC LIMIT 1
                """
            ),
            {"iid": interview_id},
        ).mappings().first()

        slot_start_time = slot_row["start_time"] if slot_row else None

        # Update schedule request status
        conn.execute(
            text(
                """
                UPDATE interview_schedule_requests
                SET status = 'accepted'
                WHERE interview_id = :iid AND status = 'candidate_selected'
                """
            ),
            {"iid": interview_id},
        )

        # Update interview
        conn.execute(
            text(
                """
                UPDATE interviews
                SET status = 'confirmed',
                    meeting_link = :link,
                    confirmed_at = :now,
                    interview_date = :interview_date
                WHERE interview_id = :iid
                """
            ),
            {
                "link": GOOGLE_MEET_LINK,
                "now": now,
                "interview_date": slot_start_time,
                "iid": interview_id,
            },
        )

    # Notify candidate
    notify_interview_accepted(interview_id, iv["candidate_user_id"], GOOGLE_MEET_LINK)

    return {
        "message": "Interview accepted and confirmed",
        "meeting_link": GOOGLE_MEET_LINK,
    }


@router.patch("/interviews/{interview_id}/reject")
def reject_interview(
    interview_id: int,
    body: RejectRequest,
    user: dict = Depends(require_interviewer),
):
    """Reject interview — updates statuses, unbooks the slot, notifies candidate."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.begin() as conn:
        iv = conn.execute(
            text(
                """
                SELECT iv.interview_id, iv.status, iv.candidate_id, c.user_id AS candidate_user_id
                FROM interviews iv
                JOIN candidates c ON c.candidate_id = iv.candidate_id
                WHERE iv.interview_id = :iid AND iv.interviewer_id = :interviewer_id
                """
            ),
            {"iid": interview_id, "interviewer_id": interviewer_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or not assigned to you",
            )

        if iv["status"] != "time_selected":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reject — interview status is '{iv['status']}' (expected 'time_selected')",
            )

        # Get the schedule request so we can unbook the slot
        sr = conn.execute(
            text(
                """
                SELECT request_id, availability_id
                FROM interview_schedule_requests
                WHERE interview_id = :iid AND status = 'candidate_selected'
                ORDER BY created_at DESC LIMIT 1
                """
            ),
            {"iid": interview_id},
        ).mappings().first()

        # Update schedule request
        conn.execute(
            text(
                """
                UPDATE interview_schedule_requests
                SET status = 'rejected'
                WHERE interview_id = :iid AND status = 'candidate_selected'
                """
            ),
            {"iid": interview_id},
        )

        # Reset interview to pending
        conn.execute(
            text(
                "UPDATE interviews SET status = 'pending' WHERE interview_id = :iid"
            ),
            {"iid": interview_id},
        )

        # Unbook the availability slot
        if sr and sr["availability_id"]:
            conn.execute(
                text(
                    "UPDATE interviewer_availability SET is_booked = 0 WHERE availability_id = :aid"
                ),
                {"aid": sr["availability_id"]},
            )

    # Notify candidate
    notify_interview_rejected(interview_id, iv["candidate_user_id"], body.reason)

    return {"message": "Interview rejected. Candidate will be notified to pick a new slot."}


# ── Feedback endpoint ─────────────────────────────────────────────────────────


@router.post("/interviews/{interview_id}/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    interview_id: int,
    body: FeedbackRequest,
    user: dict = Depends(require_interviewer),
):
    """Submit interview feedback and optionally mark the interview as completed."""
    interviewer_id = _get_interviewer_id(user["user_id"])

    with engine.begin() as conn:
        iv = conn.execute(
            text(
                """
                SELECT interview_id, status
                FROM interviews
                WHERE interview_id = :iid AND interviewer_id = :interviewer_id
                """
            ),
            {"iid": interview_id, "interviewer_id": interviewer_id},
        ).mappings().first()

        if not iv:
            raise HTTPException(
                status_code=404,
                detail="Interview not found or not assigned to you",
            )

        if iv["status"] not in ("confirmed", "completed"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot submit feedback — interview status is '{iv['status']}' (expected 'confirmed' or 'completed')",
            )

        # Insert feedback
        conn.execute(
            text(
                """
                INSERT INTO interviewer_feedback
                    (interview_id, interviewer_id, technical_score, communication_score,
                     problem_solving_score, overall_score, recommendation, notes, created_at)
                VALUES
                    (:iid, :interviewer_id, :technical_score, :communication_score,
                     :problem_solving_score, :overall_score, :recommendation, :notes, :now)
                """
            ),
            {
                "iid": interview_id,
                "interviewer_id": interviewer_id,
                "technical_score": body.technical_score,
                "communication_score": body.communication_score,
                "problem_solving_score": body.problem_solving_score,
                "overall_score": body.overall_score,
                "recommendation": body.recommendation,
                "notes": body.notes,
                "now": datetime.now(timezone.utc),
            },
        )
        feedback_id = int(
            conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()
        )

        # Update interview total_score and mark as completed
        conn.execute(
            text(
                """
                UPDATE interviews
                SET total_score = :score, status = 'completed'
                WHERE interview_id = :iid
                """
            ),
            {"score": body.overall_score, "iid": interview_id},
        )

    return {
        "message": "Feedback submitted. Interview marked as completed.",
        "feedback_id": feedback_id,
    }
