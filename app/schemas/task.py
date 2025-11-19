from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskRunBase(BaseModel):
    metric_version_id: int
    task_type: str
    payload: dict[str, Any] | None = None


class TaskRunCreate(TaskRunBase):
    pass


class TaskRunRead(TaskRunBase):
    id: int
    status: str
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: str | None = None

    model_config = ConfigDict(from_attributes=True)
