"""
notification_routes/notifications.py
-------------------------------------
FastAPI router for user notifications.
Endpoints: list, unread count, mark read, mark all read.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.auth.dependencies import get_current_user
from app.database import engine

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    skip: int = 0,
    limit: int = 20,
    user: dict = Depends(get_current_user),
):
    """Get current user's notifications, ordered by most recent first."""
    limit = min(limit, 100)
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT notification_id, user_id, title, message, type,
                       is_read, created_at
                FROM notifications
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :skip
                """
            ),
            {"uid": user["user_id"], "limit": limit, "skip": skip},
        ).mappings().all()

    return [
        {
            "notification_id": r["notification_id"],
            "user_id": r["user_id"],
            "title": r["title"],
            "message": r["message"],
            "type": r["type"],
            "is_read": bool(r["is_read"]),
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


@router.get("/unread-count")
def unread_count(user: dict = Depends(get_current_user)):
    """Get unread notification count for current user."""
    with engine.connect() as conn:
        count = conn.execute(
            text(
                "SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = :uid AND is_read = 0"
            ),
            {"uid": user["user_id"]},
        ).scalar_one()

    return {"unread_count": int(count)}


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, user: dict = Depends(get_current_user)):
    """Mark a single notification as read."""
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE notifications
                SET is_read = 1
                WHERE notification_id = :nid AND user_id = :uid
                """
            ),
            {"nid": notification_id, "uid": user["user_id"]},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@router.patch("/read-all")
def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read for the current user."""
    with engine.begin() as conn:
        result = conn.execute(
            text(
                "UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND is_read = 0"
            ),
            {"uid": user["user_id"]},
        )

    return {"message": "All notifications marked as read", "updated": result.rowcount}
