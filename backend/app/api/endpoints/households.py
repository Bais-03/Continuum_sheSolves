"""
households.py — Household endpoint
GET /api/v1/households/me
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.household import Household
from app.models.user import User
from app.schemas.household import HouseholdOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/households", tags=["households"])


@router.get("/me", response_model=HouseholdOut)
def get_my_household(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household = (
        db.query(Household)
        .filter(Household.owner_id == current_user.id)
        .first()
    )
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No household found for this user",
        )
    return household
