from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from sqlalchemy import Date, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Metric(Base):
    __tablename__ = "metric"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text())
    type: Mapped[str] = mapped_column(String(16))
    unit: Mapped[Optional[str]] = mapped_column(String(64))
    subject_area: Mapped[Optional[str]] = mapped_column(String(64))
    owner: Mapped[Optional[str]] = mapped_column(String(128))
    sensitivity: Mapped[str] = mapped_column(String(16), default="normal")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[Optional[str]] = mapped_column(String(64))
    updated_by: Mapped[Optional[str]] = mapped_column(String(64))

    versions: Mapped[list["MetricVersion"]] = relationship(back_populates="metric", cascade="all, delete-orphan")


class MetricVersion(Base):
    __tablename__ = "metric_version"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    metric_id: Mapped[int] = mapped_column(ForeignKey("metric.id", ondelete="CASCADE"))
    version: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16), default="draft")
    effective_from: Mapped[date]
    effective_to: Mapped[Optional[date]]
    grain: Mapped[list[str]] = mapped_column(JSON)
    formula_sql: Mapped[Optional[str]] = mapped_column(Text())
    formula_dsl: Mapped[Optional[dict]] = mapped_column(JSON)
    data_sources: Mapped[Optional[list[str]]] = mapped_column(JSON)
    notes: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    metric: Mapped["Metric"] = relationship(back_populates="versions")
    calibers: Mapped[list["MetricVersionCaliber"]] = relationship(
        back_populates="metric_version", cascade="all, delete-orphan"
    )


class MetricCaliber(Base):
    __tablename__ = "metric_caliber"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(32))
    expr_dsl: Mapped[Optional[dict]] = mapped_column(JSON)
    expr_sql: Mapped[Optional[str]] = mapped_column(Text())
    value_format: Mapped[Optional[str]] = mapped_column(String(32))
    unit_override: Mapped[Optional[str]] = mapped_column(String(64))
    notes: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    version_links: Mapped[list["MetricVersionCaliber"]] = relationship(
        back_populates="caliber", cascade="all, delete-orphan"
    )


class MetricVersionCaliber(Base):
    __tablename__ = "metric_version_caliber"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    metric_version_id: Mapped[int] = mapped_column(ForeignKey("metric_version.id", ondelete="CASCADE"))
    caliber_id: Mapped[Optional[int]] = mapped_column(ForeignKey("metric_caliber.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(16), default="active")
    effective_from: Mapped[Optional[date]]
    effective_to: Mapped[Optional[date]]
    order_index: Mapped[int] = mapped_column(default=0)
    override_expr_dsl: Mapped[Optional[dict]] = mapped_column(JSON)
    override_expr_sql: Mapped[Optional[str]] = mapped_column(Text())
    override_data_sources: Mapped[Optional[list[str]]] = mapped_column(JSON)
    notes: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    metric_version: Mapped["MetricVersion"] = relationship(back_populates="calibers")
    caliber: Mapped[Optional["MetricCaliber"]] = relationship(back_populates="version_links")
    values: Mapped[list["MetricValue"]] = relationship(back_populates="version_caliber", cascade="all, delete-orphan")


class MetricValue(Base):
    __tablename__ = "metric_value"

    metric_version_caliber_id: Mapped[int] = mapped_column(
        ForeignKey("metric_version_caliber.id", ondelete="CASCADE"), primary_key=True
    )
    period_date: Mapped[date] = mapped_column(Date(), primary_key=True)
    company_code: Mapped[str] = mapped_column(String(64), primary_key=True)
    dimensions_key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[Optional[float]] = mapped_column(Numeric(18, 4))
    value_status: Mapped[str] = mapped_column(String(16), default="actual")
    quality_score: Mapped[Optional[float]] = mapped_column(Numeric(10, 0))
    evidence_id: Mapped[Optional[int]]
    combo_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dim_combo.combo_id"))
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    version_caliber: Mapped["MetricVersionCaliber"] = relationship(back_populates="values")
    combo: Mapped[Optional["DimCombo"]] = relationship(back_populates="metric_values")


class DimCombo(Base):
    __tablename__ = "dim_combo"

    combo_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dim_company.company_id"))
    core_company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dim_company.company_id"))
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dim_product.product_id"))
    channel_id: Mapped[Optional[int]] = mapped_column(ForeignKey("dim_channel.channel_id"))

    metric_values: Mapped[list["MetricValue"]] = relationship(back_populates="combo")
    company: Mapped[Optional["DimCompany"]] = relationship(
        "DimCompany", foreign_keys=[company_id], lazy="joined"
    )
    core_company: Mapped[Optional["DimCompany"]] = relationship(
        "DimCompany", foreign_keys=[core_company_id], lazy="joined"
    )
    product: Mapped[Optional["DimProduct"]] = relationship("DimProduct", lazy="joined")
    channel: Mapped[Optional["DimChannel"]] = relationship("DimChannel", lazy="joined")


class DimCompany(Base):
    __tablename__ = "dim_company"

    company_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_code: Mapped[Optional[str]] = mapped_column(String(128))
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    level: Mapped[Optional[int]]
    parent_company_id: Mapped[Optional[int]]
    path: Mapped[Optional[str]] = mapped_column(Text())
    is_active: Mapped[Optional[bool]]


class DimProduct(Base):
    __tablename__ = "dim_product"

    product_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_code: Mapped[Optional[str]] = mapped_column(String(128))
    product_name: Mapped[Optional[str]] = mapped_column(String(255))
    product_type: Mapped[Optional[str]] = mapped_column(Text())


class DimChannel(Base):
    __tablename__ = "dim_channel"

    channel_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    channel_code: Mapped[Optional[str]] = mapped_column(String(128))
    channel_name: Mapped[Optional[str]] = mapped_column(String(255))
    channel_type: Mapped[Optional[str]] = mapped_column(Text())
