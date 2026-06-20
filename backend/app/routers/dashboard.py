from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(low_stock_threshold: int = 10, db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db, low_stock_threshold)
