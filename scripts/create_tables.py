"""Create database tables from SQLAlchemy models."""

from app.core.database import engine
from app.models import base, metric, dataset, task, access  # noqa: F401  # ensure models are registered


def main() -> None:
    base.Base.metadata.create_all(bind=engine)
    # base.Base.metadata.drop_all(bind=engine)
    print("Tables created successfully")


if __name__ == "__main__":
    main()
