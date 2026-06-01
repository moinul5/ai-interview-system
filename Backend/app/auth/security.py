"""
auth/security.py
----------------
Password hashing using bcrypt directly (bypasses passlib compatibility bug).
Simple password-based auth — no JWT.
"""

import bcrypt


def hash_password(plain: str) -> str:
    """Hash a plain-text password with bcrypt."""
    password_bytes = plain.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False
