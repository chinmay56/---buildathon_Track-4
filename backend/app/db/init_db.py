"""
Database Schema Initializer.
"""

from backend.app.db.session import engine, Base
import backend.app.db.models  # Register all models


def init_db():
    """
    Creates all relational database tables if they do not exist.
    """
    Base.metadata.create_all(bind=engine)
    print("✅ Relational Database Tables Initialized (SQLite / PostgreSQL).")


if __name__ == "__main__":
    init_db()
