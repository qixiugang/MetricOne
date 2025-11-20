from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.schemas.caliber import VersionCaliberCreate, VersionCaliberRead, VersionCaliberUpdate
from app.schemas.metric import (
    MetricCreate,
    MetricRead,
    MetricSummary,
    MetricUpdate,
    MetricVersionCreate,
    MetricVersionUpdate,
    MetricVersionRead,
)
from app.services.metrics import MetricService
from app.services.version_calibers import VersionCaliberService

router = APIRouter()


def get_service(db: Session = Depends(get_session)) -> MetricService:
    return MetricService(db)


def get_binding_service(db: Session = Depends(get_session)) -> VersionCaliberService:
    return VersionCaliberService(db)


@router.get("", response_model=list[MetricRead])
def list_metrics(
    *,
    keyword: str | None = Query(None, alias="keyword"),
    subject_area: str | None = Query(None),
    sensitivity: str | None = Query(None),
    service: MetricService = Depends(get_service),
) -> list[MetricRead]:
    return service.list_metrics(keyword=keyword, subject_area=subject_area, sensitivity=sensitivity)


@router.get("/summary", response_model=MetricSummary)
def get_metric_summary(service: MetricService = Depends(get_service)) -> MetricSummary:
    return service.summary()


@router.post("", response_model=MetricRead, status_code=status.HTTP_201_CREATED)
def create_metric(payload: MetricCreate, service: MetricService = Depends(get_service)):
    return service.create_metric(payload)


@router.post("/{metric_id}/publish", response_model=MetricRead)
def request_publish(metric_id: int, service: MetricService = Depends(get_service)):
    try:
        return service.request_publish(metric_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{metric_id}/versions", response_model=list[MetricVersionRead])
def list_metric_versions(metric_id: int, service: MetricService = Depends(get_service)):
    return service.list_versions(metric_id)


@router.post("/{metric_id}/versions", response_model=MetricVersionRead, status_code=status.HTTP_201_CREATED)
def create_metric_version(
    metric_id: int,
    payload: MetricVersionCreate,
    service: MetricService = Depends(get_service),
):
    try:
        return service.create_version(metric_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{metric_id}/versions/{version_id}", response_model=MetricVersionRead)
def update_metric_version(
    metric_id: int,
    version_id: int,
    payload: MetricVersionUpdate,
    service: MetricService = Depends(get_service),
):
    try:
        return service.update_version(metric_id, version_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{metric_id}/versions/{version_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric_version(
    metric_id: int,
    version_id: int,
    service: MetricService = Depends(get_service),
):
    try:
        service.delete_version(metric_id, version_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return None


@router.get(
    "/{metric_id}/versions/{version_id}/calibers",
    response_model=list[VersionCaliberRead],
)
def list_version_calibers(
    metric_id: int,
    version_id: int,
    binding_service: VersionCaliberService = Depends(get_binding_service),
):
    _ = metric_id  # not used currently but kept for clarity/context
    return binding_service.list_bindings(version_id)


@router.post(
    "/{metric_id}/versions/{version_id}/calibers",
    response_model=VersionCaliberRead,
    status_code=status.HTTP_201_CREATED,
)
def create_version_caliber(
    metric_id: int,
    version_id: int,
    payload: VersionCaliberCreate,
    binding_service: VersionCaliberService = Depends(get_binding_service),
):
    _ = metric_id
    try:
        return binding_service.create_binding(version_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch(
    "/{metric_id}/versions/{version_id}/calibers/{binding_id}",
    response_model=VersionCaliberRead,
)
def update_version_caliber(
    metric_id: int,
    version_id: int,
    binding_id: int,
    payload: VersionCaliberUpdate,
    binding_service: VersionCaliberService = Depends(get_binding_service),
):
    _ = (metric_id, version_id)
    try:
        return binding_service.update_binding(binding_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete(
    "/{metric_id}/versions/{version_id}/calibers/{binding_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_version_caliber(
    metric_id: int,
    version_id: int,
    binding_id: int,
    binding_service: VersionCaliberService = Depends(get_binding_service),
):
    _ = (metric_id, version_id)
    try:
        binding_service.delete_binding(binding_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return None


@router.get("/{metric_id}", response_model=MetricRead)
def get_metric_detail(metric_id: int, service: MetricService = Depends(get_service)) -> MetricRead:
    metric = service.get_metric(metric_id)
    if not metric:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")
    return metric


@router.patch("/{metric_id}", response_model=MetricRead)
def update_metric(
    metric_id: int,
    payload: MetricUpdate,
    service: MetricService = Depends(get_service),
):
    try:
        return service.update_metric(metric_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric(metric_id: int, service: MetricService = Depends(get_service)) -> None:
    try:
        service.delete_metric(metric_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return None
