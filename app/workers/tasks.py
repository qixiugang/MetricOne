from __future__ import annotations

import json
import random
import time

from loguru import logger

from app.core.celery_app import celery_app


@celery_app.task
def trigger_task_run(task_id: int) -> None:
    logger.info("Running metric task {}", task_id)
    time.sleep(1)
    logger.info("Task {} completed", task_id)


@celery_app.task
def compile_dsl(metric_id: int, dsl_text: str) -> str:
    logger.info("Compiling metric %s", metric_id)
    pseudo_plan = {"metric_id": metric_id, "nodes": random.randint(1, 3), "dsl": dsl_text}
    return json.dumps(pseudo_plan)
