from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.metric import MetricCaliber, MetricVersion, MetricVersionCaliber
from app.schemas.caliber import VersionCaliberCreate, VersionCaliberRead, VersionCaliberUpdate


class VersionCaliberService:
    def __init__(self, db: Session):
        self.db = db

    def list_bindings(self, version_id: int) -> list[MetricVersionCaliber]:
        return (
            self.db.query(MetricVersionCaliber)
            .filter(MetricVersionCaliber.metric_version_id == version_id)
            .order_by(MetricVersionCaliber.order_index.asc())
            .all()
        )

    def create_binding(self, version_id: int, payload: VersionCaliberCreate) -> MetricVersionCaliber:
        version = self.db.query(MetricVersion).filter(MetricVersion.id == version_id).first()
        if not version:
            raise ValueError("Metric version not found")
        caliber_exists = self.db.query(MetricCaliber).filter(MetricCaliber.id == payload.caliber_id).first()
        if not caliber_exists:
            raise ValueError("Caliber not found")
        binding = MetricVersionCaliber(
            metric_version=version,
            caliber_id=payload.caliber_id,
            status=payload.status,
            order_index=payload.order_index,
            override_expr_sql=payload.override_expr_sql,
            override_expr_dsl=payload.override_expr_dsl,
            override_data_sources=payload.override_data_sources,
            notes=payload.notes,
        )
        self.db.add(binding)
        self.db.commit()
        self.db.refresh(binding)
        return binding

    def update_binding(self, binding_id: int, payload: VersionCaliberUpdate) -> MetricVersionCaliber:
        binding = self.db.query(MetricVersionCaliber).filter(MetricVersionCaliber.id == binding_id).first()
        if not binding:
            raise ValueError("Binding not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(binding, field, value)
        self.db.commit()
        self.db.refresh(binding)
        return binding

    def delete_binding(self, binding_id: int) -> None:
        binding = self.db.query(MetricVersionCaliber).filter(MetricVersionCaliber.id == binding_id).first()
        if not binding:
            raise ValueError("Binding not found")
        self.db.delete(binding)
        self.db.commit()
