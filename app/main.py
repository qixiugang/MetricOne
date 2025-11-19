from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import metrics, datasets, tasks, auth, dashboard, calibers, dimensions
from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title="MetricOne 指标管理系统",
    version="0.1.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(calibers.router, prefix="/api/calibers", tags=["calibers"])
app.include_router(dimensions.router, prefix="/api/dimensions", tags=["dimensions"])


@app.get("/healthz", tags=["meta"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "env": settings.env or "local"}
