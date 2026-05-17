"""
auth/models.py
--------------
SQLAlchemy ORM model for the `users` table.
Matches the actual XAMPP schema exactly.
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id       = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name          = Column(String(100), nullable=False)           # actual DB column
    email         = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)           # actual DB column
    role          = Column(String(50), nullable=False, default="candidate")
    created_at    = Column(DateTime, default=datetime.utcnow)
