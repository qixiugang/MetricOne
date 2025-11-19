from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.task import TaskRun
from app.schemas.task import TaskRunCreate


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def enqueue(self, payload: TaskRunCreate) -> TaskRun:
        task_run = TaskRun(**payload.model_dump())
        self.db.add(task_run)
        self.db.commit()
        self.db.refresh(task_run)
        return task_run

    def mark_started(self, task_id: int) -> TaskRun:
        task = self.db.query(TaskRun).filter(TaskRun.id == task_id).first()
        if not task:
            raise ValueError("Task not found")
        task.status = "running"
        task.started_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(task)
        return task

    def list(self) -> list[TaskRun]:
        return self.db.query(TaskRun).order_by(TaskRun.created_at.desc()).all()
