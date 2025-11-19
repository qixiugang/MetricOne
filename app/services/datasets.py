from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.schemas.dataset import DatasetCreate


class DatasetService:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Dataset]:
        return self.db.query(Dataset).order_by(Dataset.created_at.desc()).all()

    def create(self, payload: DatasetCreate) -> Dataset:
        dataset = Dataset(**payload.model_dump())
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)
        return dataset
