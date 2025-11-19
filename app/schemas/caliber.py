from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class CaliberBase(BaseModel):
    code: str
    name: str
    category: str
    expr_dsl: dict[str, Any] | None = None
    expr_sql: str | None = None
    value_format: str | None = None
    unit_override: str | None = None
    notes: str | None = None


class CaliberCreate(CaliberBase):
    pass


class CaliberUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    expr_dsl: dict[str, Any] | None = None
    expr_sql: str | None = None
    value_format: str | None = None
    unit_override: str | None = None
    notes: str | None = None


class CaliberRead(CaliberBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VersionCaliberBase(BaseModel):
    caliber_id: int
    status: str = "active"
    order_index: int = 0
    override_expr_sql: str | None = None
    override_expr_dsl: dict | None = None
    override_data_sources: list[str] | None = None
    notes: str | None = None


class VersionCaliberCreate(VersionCaliberBase):
    pass


class VersionCaliberUpdate(BaseModel):
    status: str | None = None
    order_index: int | None = None
    override_expr_sql: str | None = None
    override_expr_dsl: dict | None = None
    override_data_sources: list[str] | None = None
    notes: str | None = None


class VersionCaliberRead(VersionCaliberBase):
    id: int
    metric_version_id: int
    caliber: CaliberRead | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
