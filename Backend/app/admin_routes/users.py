"""
admin_routes/users.py
---------------------
Admin endpoints for user management.
All endpoints require the 'admin' role.
"""

from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import text

from app.auth.dependencies import require_admin
from app.database import engine

router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


# ── Request / Response schemas ────────────────────────────────────────────────


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "candidate"  # candidate | interviewer | admin


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


# ── Helpers ───────────────────────────────────────────────────────────────────


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _user_with_profile(row: dict) -> dict:
    """Serialize a user row, converting datetimes to ISO strings and mapping user_id to id."""
    out = dict(row)
    if "user_id" in out:
        out["id"] = out["user_id"]
    for key in ("created_at", "updated_at"):
        if key in out and out[key] is not None:
            out[key] = out[key].isoformat()
    return out


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("")
def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(require_admin),
):
    """List all users with optional role filter and name/email search."""
    query = """
        SELECT u.user_id, u.name, u.email, u.role, u.created_at,
               c.candidate_id, c.phone AS candidate_phone,
               i.interviewer_id, i.expertise
        FROM users u
        LEFT JOIN candidates c ON c.user_id = u.user_id
        LEFT JOIN interviewers i ON i.user_id = u.user_id
        WHERE 1=1
    """
    params: dict = {"limit": min(limit, 200), "skip": skip}

    if role:
        query += " AND u.role = :role"
        params["role"] = role
    if search:
        query += " AND (u.name LIKE :search OR u.email LIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY u.user_id DESC LIMIT :limit OFFSET :skip"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).mappings().all()

    return [_user_with_profile(r) for r in rows]


@router.get("/{user_id}")
def get_user(user_id: int, admin: dict = Depends(require_admin)):
    """Get single user detail with candidate/interviewer profile."""
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT u.user_id, u.name, u.email, u.role, u.created_at,
                       c.candidate_id, c.phone AS candidate_phone,
                       c.experience_years, c.skills,
                       i.interviewer_id, i.expertise
                FROM users u
                LEFT JOIN candidates c ON c.user_id = u.user_id
                LEFT JOIN interviewers i ON i.user_id = u.user_id
                WHERE u.user_id = :uid
                """
            ),
            {"uid": user_id},
        ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_with_profile(row)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(body: CreateUserRequest, admin: dict = Depends(require_admin)):
    """Create a new user (admin can assign any role including admin)."""
    with engine.begin() as conn:
        # Check duplicate email
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": body.email},
        ).mappings().first()
        if existing:
            raise HTTPException(
                status_code=409, detail="An account with this email already exists."
            )

        hashed = _hash_password(body.password)
        conn.execute(
            text(
                """
                INSERT INTO users (name, email, password_hash, role)
                VALUES (:name, :email, :password_hash, :role)
                """
            ),
            {
                "name": body.name,
                "email": body.email,
                "password_hash": hashed,
                "role": body.role,
            },
        )
        new_id = conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar_one()

        # Auto-create profile row based on role
        if body.role == "candidate":
            conn.execute(
                text("INSERT INTO candidates (user_id) VALUES (:uid)"),
                {"uid": int(new_id)},
            )
        elif body.role == "interviewer":
            conn.execute(
                text("INSERT INTO interviewers (user_id) VALUES (:uid)"),
                {"uid": int(new_id)},
            )

    return {"message": "User created successfully", "user_id": int(new_id)}


@router.patch("/{user_id}")
def update_user(
    user_id: int, body: UpdateUserRequest, admin: dict = Depends(require_admin)
):
    """Update user name, email, or role."""
    sets = []
    params: dict = {"uid": user_id}

    if body.name is not None:
        sets.append("name = :name")
        params["name"] = body.name
    if body.email is not None:
        sets.append("email = :email")
        params["email"] = body.email
    if body.role is not None:
        sets.append("role = :role")
        params["role"] = body.role

    if not sets:
        raise HTTPException(status_code=400, detail="No fields to update")

    with engine.begin() as conn:
        result = conn.execute(
            text(f"UPDATE users SET {', '.join(sets)} WHERE user_id = :uid"), params
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int, body: ResetPasswordRequest, admin: dict = Depends(require_admin)
):
    """Reset a user's password (admin only)."""
    hashed = _hash_password(body.new_password)
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE users SET password_hash = :pw WHERE user_id = :uid"),
            {"pw": hashed, "uid": user_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Password reset successfully"}


@router.patch("/{user_id}/disable")
def disable_user(user_id: int, admin: dict = Depends(require_admin)):
    """Disable a user account. Sets role to 'disabled' to prevent login."""
    if user_id == admin["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE users SET role = 'disabled' WHERE user_id = :uid"),
            {"uid": user_id},
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User disabled successfully"}
