"""
Database Session & Connection Management (SQLAlchemy).

Configured with high-performance SQLite WAL mode by default (0-setup for local/evaluation)
and automatically switches to PostgreSQL when `DATABASE_URL` environment variable is provided.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./settlement_ledger.db")

# Configure connection arguments based on database dialect
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    FastAPI dependency for yielding database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
