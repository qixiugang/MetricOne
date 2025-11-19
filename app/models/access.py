from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    description: Mapped[Optional[str]]


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[Optional[str]]
    email: Mapped[Optional[str]]
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)


class AccessPolicy(Base, TimestampMixin):
    __tablename__ = "access_policies"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_id: Mapped[int] = mapped_column(ForeignKey("metric.id", ondelete="CASCADE"))
    role: Mapped[str]
    sensitivity: Mapped[str] = mapped_column(default="normal")
    actions: Mapped[list[str]] = mapped_column(JSON)

    metric: Mapped["Metric"] = relationship("Metric")
