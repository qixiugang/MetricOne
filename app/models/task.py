from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TaskRun(Base, TimestampMixin):
    __tablename__ = "task_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_version_id: Mapped[int] = mapped_column(ForeignKey("metric_version.id"))
    task_type: Mapped[str]
    status: Mapped[str] = mapped_column(default="pending")
    started_at: Mapped[Optional[datetime]]
    finished_at: Mapped[Optional[datetime]]
    payload: Mapped[Optional[dict]] = mapped_column(JSON)
    result: Mapped[Optional[dict]] = mapped_column(JSON)
    error: Mapped[Optional[str]]

    metric_version: Mapped["MetricVersion"] = relationship(back_populates="task_runs")


from app.models.metric import MetricVersion  # noqa: E402  circular

MetricVersion.task_runs = relationship(
    TaskRun, back_populates="metric_version", cascade="all, delete-orphan"
)
