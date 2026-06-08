"""
auth/dependencies.py
--------------------
FastAPI dependencies for database sessions and role-based access control.
Uses X-User-Id header for user identification (no JWT).
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy import text

from app.database import SessionLocal, engine


def get_db():
    """Yield a SQLAlchemy session, closing it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(x_user_id: Optional[str] = Header(None)):
    """Get current user from X-User-Id header."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    try:
        user_id = int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT user_id, name, email, role FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        )
        user = result.mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


def require_role(*roles):
    """Dependency factory that checks user role."""

    def role_checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user['role']}' not authorized. Required: {roles}",
            )
        return user

    return role_checker


# Convenience dependencies
require_admin = require_role("admin")
require_candidate = require_role("candidate")
require_interviewer = require_role("interviewer")
