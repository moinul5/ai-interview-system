"""
auth/router.py
--------------
FastAPI router exposing:
  POST /auth/register  → create account (hashes password with bcrypt)
  POST /auth/login     → validates credentials, returns user object (no JWT)

Uses actual XAMPP DB column names: `name`, `password_hash`.
Plain-text fallback for existing seed users (e.g. password '252525').
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_db
from app.auth.models import User
from app.auth.schemas import LoginRequest, RegisterRequest, UserResponse
from app.auth.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_user_response(user: User) -> UserResponse:
    """Map ORM User → UserResponse."""
    return UserResponse(
        id=user.user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
    )


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Reject duplicate emails
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return _build_user_response(new_user)


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=UserResponse,
    summary="Login with email and password",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Try bcrypt first (new registered users)
    # Fall back to plain-text for legacy seed data (e.g. '252525')
    password_ok = verify_password(payload.password, user.password_hash)
    if not password_ok:
        password_ok = (payload.password == user.password_hash)

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return _build_user_response(user)
