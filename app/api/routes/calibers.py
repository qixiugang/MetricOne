from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.schemas.caliber import CaliberCreate, CaliberRead, CaliberUpdate
from app.services.calibers import CaliberService

router = APIRouter()


def get_service(db: Session = Depends(get_session)) -> CaliberService:
    return CaliberService(db)


@router.get("", response_model=list[CaliberRead])
def list_calibers(service: CaliberService = Depends(get_service)) -> list[CaliberRead]:
    return service.list_calibers()


@router.post("", response_model=CaliberRead, status_code=status.HTTP_201_CREATED)
def create_caliber(payload: CaliberCreate, service: CaliberService = Depends(get_service)) -> CaliberRead:
    return service.create_caliber(payload)


@router.patch("/{caliber_id}", response_model=CaliberRead)
def update_caliber(
    caliber_id: int,
    payload: CaliberUpdate,
    service: CaliberService = Depends(get_service),
) -> CaliberRead:
    try:
        return service.update_caliber(caliber_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
