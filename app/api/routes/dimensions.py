from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.schemas.dimension import ChannelRead, ComboRead, CompanyRead, ProductRead
from app.services.dimensions import DimensionService

router = APIRouter()


def get_service(db: Session = Depends(get_session)) -> DimensionService:
    return DimensionService(db)


@router.get("/companies", response_model=list[CompanyRead])
def list_companies(keyword: str | None = Query(None), service: DimensionService = Depends(get_service)):
    return service.list_companies(keyword)


@router.get("/products", response_model=list[ProductRead])
def list_products(keyword: str | None = Query(None), service: DimensionService = Depends(get_service)):
    return service.list_products(keyword)


@router.get("/channels", response_model=list[ChannelRead])
def list_channels(keyword: str | None = Query(None), service: DimensionService = Depends(get_service)):
    return service.list_channels(keyword)


@router.get("/combos", response_model=list[ComboRead])
def list_combos(keyword: str | None = Query(None), service: DimensionService = Depends(get_service)):
    combos = service.list_combos(keyword)
    results: list[ComboRead] = []
    for combo in combos:
        results.append(
            ComboRead(
                combo_id=combo.combo_id,
                company_id=combo.company_id,
                core_company_id=combo.core_company_id,
                product_id=combo.product_id,
                channel_id=combo.channel_id,
                company_name=(combo.company.company_name if combo.company else None),
                core_company_name=(combo.core_company.company_name if combo.core_company else None),
                product_name=(combo.product.product_name if combo.product else None),
                channel_name=(combo.channel.channel_name if combo.channel else None),
            )
        )
    return results
