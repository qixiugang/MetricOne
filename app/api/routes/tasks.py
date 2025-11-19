from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.schemas.task import TaskRunCreate, TaskRunRead
from app.services.tasks import TaskService
from app.workers.tasks import trigger_task_run

router = APIRouter()


def get_service(db: Session = Depends(get_session)) -> TaskService:
    return TaskService(db)


@router.get("/", response_model=list[TaskRunRead])
def list_task_runs(service: TaskService = Depends(get_service)):
    return service.list()


@router.post("/", response_model=TaskRunRead, status_code=status.HTTP_202_ACCEPTED)
def create_task_run(payload: TaskRunCreate, service: TaskService = Depends(get_service)):
    task = service.enqueue(payload)
    trigger_task_run.delay(task.id)  # noqa: SLF001 - celery handles async execution
    return task
