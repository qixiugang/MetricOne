from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class DatasetBase(BaseModel):
    name: str
    catalog: str | None = None
    schema_json: dict[str, Any]


class DatasetCreate(DatasetBase):
    sample_file_id: int | None = None


class DatasetRead(DatasetBase):
    id: int
    sample_file_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
