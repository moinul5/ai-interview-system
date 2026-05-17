"""
auth/schemas.py
---------------
Pydantic v2 schemas for request/response validation.
Simple password-based auth — no JWT.
Field names match the actual XAMPP DB columns (name, password_hash).
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ─── Request Schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:     str = Field(..., min_length=2, max_length=100, description="Full name")
    email:    EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role:     Literal["candidate", "interviewer"] = "candidate"


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


# ─── Response Schemas ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id:         int
    name:       str
    email:      str
    role:       str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
