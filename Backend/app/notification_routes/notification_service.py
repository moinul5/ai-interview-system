"""
notification_routes/notification_service.py
-------------------------------------------
Helper functions for creating and sending in-app notifications.
All operations use raw SQL via engine.connect() + text().
"""

from datetime import datetime, timezone

from sqlalchemy import text

from app.database import engine


def create_notification(
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "in_app",
) -> int | None:
    """Insert a notification row and return its ID."""
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                    VALUES (:user_id, :title, :message, :type, 0, :created_at)
                    """
                ),
                {
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "type": notif_type,
                    "created_at": datetime.now(timezone.utc),
                },
            )
            row = conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()
            return int(row)
    except Exception:
        # Silently fail so notification errors never break core flows
        return None


def notify_interview_created(
    interview_id: int,
    candidate_user_id: int,
    interviewer_user_id: int,
) -> None:
    """Notify both candidate and interviewer about a newly created interview."""
    create_notification(
        user_id=candidate_user_id,
        title="New Interview Scheduled",
        message=(
            f"You have been assigned a new human interview (ID: {interview_id}). "
            "Please check your dashboard to view available time slots."
        ),
    )
    create_notification(
        user_id=interviewer_user_id,
        title="New Interview Assignment",
        message=(
            f"You have been assigned as interviewer for interview ID: {interview_id}. "
            "The candidate will select a time slot from your availability."
        ),
    )


def notify_slot_selected(
    interview_id: int,
    interviewer_user_id: int,
    candidate_name: str,
    slot_time: str,
) -> None:
    """Notify interviewer that a candidate selected a time slot."""
    create_notification(
        user_id=interviewer_user_id,
        title="Candidate Selected Time Slot",
        message=(
            f"{candidate_name} has selected a time slot ({slot_time}) for "
            f"interview ID: {interview_id}. Please accept or reject the request."
        ),
    )


def notify_interview_accepted(
    interview_id: int,
    candidate_user_id: int,
    meeting_link: str,
) -> None:
    """Notify candidate that their interview has been confirmed."""
    create_notification(
        user_id=candidate_user_id,
        title="Interview Confirmed",
        message=(
            f"Your interview (ID: {interview_id}) has been confirmed by the interviewer. "
            f"Meeting link: {meeting_link}"
        ),
    )


def notify_interview_rejected(
    interview_id: int,
    candidate_user_id: int,
    reason: str,
) -> None:
    """Notify candidate that their selected slot was rejected."""
    create_notification(
        user_id=candidate_user_id,
        title="Interview Slot Rejected",
        message=(
            f"Your selected time slot for interview (ID: {interview_id}) was rejected. "
            f"Reason: {reason}. Please select a new time slot."
        ),
    )
