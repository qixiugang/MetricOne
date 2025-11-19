from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "metricone",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_default_queue="default",
    task_routes={
        "app.workers.tasks.trigger_task_run": {"queue": "metrics"},
        "app.workers.tasks.compile_dsl": {"queue": "compiler"},
    },
)
