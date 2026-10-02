from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.household import Household
from app.services.auth_service import get_current_user, verify_csrf_token

def get_current_household(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Household:
    household = db.query(Household).filter(Household.owner_id == current_user.id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    return household

async def verify_csrf(request: Request):
    """Dependency to verify CSRF token for state-changing endpoints."""
    verify_csrf_token(request)
