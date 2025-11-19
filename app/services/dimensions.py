from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.metric import DimChannel, DimCombo, DimCompany, DimProduct


class DimensionService:
    def __init__(self, db: Session):
        self.db = db

    def list_companies(self, keyword: str | None = None) -> list[DimCompany]:
        query = self.db.query(DimCompany)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.filter(
                or_(DimCompany.company_name.ilike(pattern), DimCompany.company_code.ilike(pattern))
            )
        return query.order_by(DimCompany.company_id.desc()).all()

    def list_products(self, keyword: str | None = None) -> list[DimProduct]:
        query = self.db.query(DimProduct)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.filter(
                or_(DimProduct.product_name.ilike(pattern), DimProduct.product_code.ilike(pattern))
            )
        return query.order_by(DimProduct.product_id.desc()).all()

    def list_channels(self, keyword: str | None = None) -> list[DimChannel]:
        query = self.db.query(DimChannel)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.filter(
                or_(DimChannel.channel_name.ilike(pattern), DimChannel.channel_code.ilike(pattern))
            )
        return query.order_by(DimChannel.channel_id.desc()).all()

    def list_combos(self, keyword: str | None = None) -> list[DimCombo]:
        query = self.db.query(DimCombo)
        if keyword:
            pattern = f"%{keyword}%"
            query = query.join(DimCombo.company, isouter=True).join(DimCombo.product, isouter=True).join(
                DimCombo.channel, isouter=True
            )
            query = query.filter(
                or_(
                    DimCombo.combo_id.cast(str).ilike(pattern),
                    DimCompany.company_name.ilike(pattern),
                    DimProduct.product_name.ilike(pattern),
                    DimChannel.channel_name.ilike(pattern),
                )
            )
        return query.order_by(DimCombo.combo_id.desc()).all()
