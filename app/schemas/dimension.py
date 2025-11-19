from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CompanyRead(BaseModel):
    company_id: int
    company_code: str | None = None
    company_name: str | None = None
    level: int | None = None
    parent_company_id: int | None = None
    is_active: bool | None = None
    model_config = ConfigDict(from_attributes=True)


class ProductRead(BaseModel):
    product_id: int
    product_code: str | None = None
    product_name: str | None = None
    product_type: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ChannelRead(BaseModel):
    channel_id: int
    channel_code: str | None = None
    channel_name: str | None = None
    channel_type: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ComboRead(BaseModel):
    combo_id: int
    company_id: int | None = None
    core_company_id: int | None = None
    product_id: int | None = None
    channel_id: int | None = None
    company_name: str | None = None
    core_company_name: str | None = None
    product_name: str | None = None
    channel_name: str | None = None
    model_config = ConfigDict(from_attributes=True)
