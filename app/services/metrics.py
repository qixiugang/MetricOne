from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.metric import Metric, MetricVersion
from app.schemas.metric import MetricCreate, MetricSummary, MetricUpdate, MetricVersionCreate, MetricVersionUpdate


class MetricService:
    def __init__(self, db: Session):
        self.db = db

    def list_metrics(self, keyword: str | None = None, subject_area: str | None = None, sensitivity: str | None = None):
        query = self.db.query(Metric)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.filter(
                or_(
                    Metric.code.ilike(pattern),
                    Metric.name.ilike(pattern),
                    Metric.owner.ilike(pattern),
                )
            )
        if subject_area:
            query = query.filter(Metric.subject_area == subject_area)
        if sensitivity:
            query = query.filter(Metric.sensitivity == sensitivity)
        return query.order_by(Metric.code).all()

    def create_metric(self, payload: MetricCreate) -> Metric:
        metric = Metric(
            code=payload.code,
            name=payload.name,
            type=payload.type,
            description=payload.description,
            unit=payload.unit,
            subject_area=payload.subject_area,
            owner=payload.owner,
            sensitivity=payload.sensitivity,
            created_by=payload.created_by,
            updated_by=payload.updated_by or payload.created_by,
        )
        version = self._build_version(metric, payload.initial_version)
        metric.versions.append(version)
        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)
        return metric

    def get_metric(self, metric_id: int) -> Metric | None:
        return self.db.query(Metric).filter(Metric.id == metric_id).first()

    def request_publish(self, metric_id: int) -> Metric:
        metric = self.db.query(Metric).filter(Metric.id == metric_id).first()
        if not metric:
            raise ValueError("Metric not found")
        for version in metric.versions:
            if version.status == "draft":
                version.status = "pending_review"
        self.db.commit()
        self.db.refresh(metric)
        return metric

    def list_versions(self, metric_id: int):
        return (
            self.db.query(MetricVersion)
            .filter(MetricVersion.metric_id == metric_id)
            .order_by(MetricVersion.created_at.desc())
            .all()
        )

    def create_version(self, metric_id: int, payload: MetricVersionCreate) -> MetricVersion:
        metric = self.get_metric(metric_id)
        if not metric:
            raise ValueError("Metric not found")

        next_version = payload.version or self._next_version_label(metric_id)
        version = self._build_version(metric, payload, next_version)
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version

    def update_version(self, metric_id: int, version_id: int, payload: MetricVersionUpdate) -> MetricVersion:
        version = (
            self.db.query(MetricVersion)
            .filter(MetricVersion.metric_id == metric_id, MetricVersion.id == version_id)
            .first()
        )
        if not version:
            raise ValueError("Metric version not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            if hasattr(version, field):
                setattr(version, field, value)
        self.db.commit()
        self.db.refresh(version)
        return version

    def summary(self) -> MetricSummary:
        total_metrics = self.db.query(func.count(Metric.id)).scalar() or 0
        sensitive_metrics = (
            self.db.query(func.count(Metric.id)).filter(Metric.sensitivity != "normal").scalar() or 0
        )
        active_versions = (
            self.db.query(func.count(MetricVersion.id)).filter(MetricVersion.status == "active").scalar() or 0
        )
        draft_versions = (
            self.db.query(func.count(MetricVersion.id)).filter(MetricVersion.status == "draft").scalar() or 0
        )
        return MetricSummary(
            total_metrics=total_metrics,
            sensitive_metrics=sensitive_metrics,
            active_versions=active_versions,
            draft_versions=draft_versions,
        )

    def _next_version_label(self, metric_id: int) -> str:
        latest = (
            self.db.query(MetricVersion.version)
            .filter(MetricVersion.metric_id == metric_id)
            .order_by(MetricVersion.created_at.desc())
            .limit(1)
            .scalar()
        )
        if not latest:
            return "v1"
        digits = "".join(ch for ch in str(latest) if ch.isdigit())
        if digits.isdigit():
            return f"v{int(digits) + 1}"
        return f"{latest}_new"

    def _build_version(
        self,
        metric: Metric,
        payload: MetricVersionCreate,
        version_label: str | None = None,
    ) -> MetricVersion:
        version = MetricVersion(
            metric=metric,
            version=version_label or payload.version or "v1",
            status=payload.status or "draft",
            subject_area=payload.subject_area,
            effective_from=payload.effective_from,
            effective_to=payload.effective_to,
            grain=payload.grain,
            formula_sql=payload.formula_sql,
            data_sources=payload.data_sources,
            notes=payload.notes,
            formula_dsl=payload.formula_dsl,
        )
        return version

    def update_metric(self, metric_id: int, payload: MetricUpdate) -> Metric:
        metric = self.get_metric(metric_id)
        if not metric:
            raise ValueError("Metric not found")
        for field in (
            "name",
            "type",
            "description",
            "unit",
            "subject_area",
            "owner",
            "sensitivity",
            "updated_by",
        ):
            value = getattr(payload, field, None)
            if value is not None:
                setattr(metric, field, value)
        self.db.commit()
        self.db.refresh(metric)
        return metric

    def delete_metric(self, metric_id: int) -> None:
        metric = self.get_metric(metric_id)
        if not metric:
            raise ValueError("Metric not found")
        self.db.delete(metric)
        self.db.commit()
