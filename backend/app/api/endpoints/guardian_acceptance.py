from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.schemas.guardian_acceptance import (
    GuardianInvitationAcceptRequest,
    GuardianInvitationAcceptResponse,
)
from app.services.auth_service import (
    create_access_token,
    generate_csrf_token,
)
from app.services.guardian_acceptance_service import (
    accept_guardian_invitation,
)


router = APIRouter(
    prefix="/guardian",
    tags=["Guardian"],
)


def _set_auth_cookies(response: Response, user_id: str) -> None:
    """
    Issue the same JWT + CSRF cookies used by normal authentication.
    """

    from datetime import timedelta

    access_token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    csrf_token = generate_csrf_token()

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/invitation/{token}/accept",
    response_model=GuardianInvitationAcceptResponse,
    status_code=status.HTTP_201_CREATED,
)
def accept_invitation(
    token: str,
    request: GuardianInvitationAcceptRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> GuardianInvitationAcceptResponse:
    """
    Accept a Guardian invitation and create a separate Guardian account.

    This endpoint does not require authentication because the Guardian
    does not have an account yet.
    """

    try:
        result = accept_guardian_invitation(
            db=db,
            token=token,
            request=request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    _set_auth_cookies(
        response=response,
        user_id=result.user_id,
    )

    return result