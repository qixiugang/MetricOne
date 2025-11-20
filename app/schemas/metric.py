from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.caliber import VersionCaliberRead


class MetricVersionBase(BaseModel):
    version: str | None = None
    status: str = "draft"
    formula_sql: str | None = None
    formula_dsl: dict | None = None
    grain: list[str] | None = None
    data_sources: list[str] | None = None
    notes: str | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    subject_area: str | None = None


class MetricVersionCreate(MetricVersionBase):
    effective_from: date
    grain: list[str]


class MetricVersionUpdate(BaseModel):
    version: str | None = None
    status: str | None = None
    formula_sql: str | None = None
    formula_dsl: dict | None = None
    grain: list[str] | None = None
    data_sources: list[str] | None = None
    notes: str | None = None
    effective_from: date | None = None
    effective_to: date | None = None


class MetricVersionRead(MetricVersionBase):
    id: int
    metric_id: int
    created_at: datetime
    calibers: list[VersionCaliberRead] = []

    model_config = ConfigDict(from_attributes=True)


class MetricBase(BaseModel):
    code: str
    name: str
    type: str
    description: str | None = None
    unit: str | None = None
    subject_area: str | None = None
    owner: str | None = None
    sensitivity: str = "normal"
    created_by: str | None = None
    updated_by: str | None = None


class MetricCreate(MetricBase):
    initial_version: MetricVersionCreate


class MetricRead(MetricBase):
    id: int
    created_at: datetime
    updated_at: datetime
    versions: list[MetricVersionRead] = []

    model_config = ConfigDict(from_attributes=True)


class MetricSummary(BaseModel):
    total_metrics: int
    sensitive_metrics: int
    active_versions: int
    draft_versions: int


class MetricUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    unit: str | None = None
    subject_area: str | None = None
    owner: str | None = None
    sensitivity: str | None = None
    updated_by: str | None = None
