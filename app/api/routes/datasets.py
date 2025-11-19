from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.schemas.dataset import DatasetCreate, DatasetRead
from app.services.datasets import DatasetService

router = APIRouter()


def get_service(db: Session = Depends(get_session)) -> DatasetService:
    return DatasetService(db)


@router.get("/", response_model=list[DatasetRead])
def list_datasets(service: DatasetService = Depends(get_service)) -> list[DatasetRead]:
    return service.list()


@router.post("/", response_model=DatasetRead, status_code=status.HTTP_201_CREATED)
def create_dataset(payload: DatasetCreate, service: DatasetService = Depends(get_service)) -> DatasetRead:
    return service.create(payload)
