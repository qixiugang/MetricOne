from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.metric import MetricCaliber
from app.schemas.caliber import CaliberCreate, CaliberRead, CaliberUpdate


class CaliberService:
    def __init__(self, db: Session):
        self.db = db

    def list_calibers(self) -> list[MetricCaliber]:
        return self.db.query(MetricCaliber).order_by(MetricCaliber.code).all()

    def create_caliber(self, payload: CaliberCreate) -> MetricCaliber:
        caliber = MetricCaliber(**payload.model_dump())
        self.db.add(caliber)
        self.db.commit()
        self.db.refresh(caliber)
        return caliber

    def update_caliber(self, caliber_id: int, payload: CaliberUpdate) -> MetricCaliber:
        caliber = self.db.query(MetricCaliber).filter(MetricCaliber.id == caliber_id).first()
        if not caliber:
            raise ValueError("Caliber not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(caliber, field, value)
        self.db.commit()
        self.db.refresh(caliber)
        return caliber
