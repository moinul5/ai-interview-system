"""
auth/dependencies.py
--------------------
FastAPI dependency for database sessions.
JWT removed — simple password-only auth.
"""

from app.database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
