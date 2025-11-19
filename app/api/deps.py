from sqlalchemy.orm import Session

from app.core.database import get_db


def get_session() -> Session:  # pragma: no cover - thin wrapper for FastAPI Depends
    yield from get_db()
