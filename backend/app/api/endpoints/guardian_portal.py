from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.guardian_portal import GuardianPortalResponse
from app.services.guardian_portal_service import get_guardian_portal


router = APIRouter(
    prefix="/guardian",
    tags=["Guardian Portal"],
)


@router.get(
    "/me",
    response_model=GuardianPortalResponse,
)
def get_my_guardian_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GuardianPortalResponse:
    """
    Return the authenticated Guardian's restricted portal information.

    The Guardian is identified from the authenticated session.
    No guardian_id is accepted from the client.
    """

    portal = get_guardian_portal(
        db=db,
        user_id=current_user.id,
    )

    if portal is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not an active Guardian.",
        )

    return portal