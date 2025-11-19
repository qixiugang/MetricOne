from __future__ import annotations

import httpx

from app.core.config import settings


async def trigger_airflow_dag(dag_id: str, conf: dict | None = None) -> dict:
    headers = {"Authorization": f"Bearer {settings.airflow_token}"} if settings.airflow_token else {}
    async with httpx.AsyncClient(base_url=settings.airflow_api, headers=headers, timeout=10) as client:
        response = await client.post(f"/dags/{dag_id}/dagRuns", json={"conf": conf or {}})
        response.raise_for_status()
        return response.json()
