from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Dataset(Base, TimestampMixin):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    catalog: Mapped[Optional[str]]
    schema_json: Mapped[dict] = mapped_column(JSON)
    sample_file_id: Mapped[Optional[int]] = mapped_column(ForeignKey("file_artifacts.id"))

    quality_rules: Mapped[list[QualityRule]] = relationship(back_populates="dataset")


class QualityRule(Base, TimestampMixin):
    __tablename__ = "quality_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id", ondelete="CASCADE"))
    name: Mapped[str]
    rule_type: Mapped[str]
    expression: Mapped[str]
    severity: Mapped[str] = mapped_column(default="info")

    dataset: Mapped[Dataset] = relationship(back_populates="quality_rules")


class FileArtifact(Base, TimestampMixin):
    __tablename__ = "file_artifacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str]
    bucket: Mapped[str]
    content_type: Mapped[str]
    size: Mapped[int]
    tags: Mapped[Optional[dict]] = mapped_column(JSON)
