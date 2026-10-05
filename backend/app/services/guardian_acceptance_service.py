from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.guardian import Guardian
from app.models.guardian_invitation import GuardianInvitation
from app.models.user import User
from app.schemas.guardian_acceptance import (
    GuardianInvitationAcceptRequest,
    GuardianInvitationAcceptResponse,
)
from app.services.auth_service import hash_password
from app.services.guardian_invitation_service import (
    get_invitation_by_token,
)


def accept_guardian_invitation(
    db: Session,
    token: str,
    request: GuardianInvitationAcceptRequest,
) -> GuardianInvitationAcceptResponse:
    """
    Accept a Guardian invitation and create the Guardian's
    separate User account.

    The Guardian account does NOT receive a household.
    Instead, the new User is linked directly to the Guardian
    record through Guardian.user_id.
    """

    # ------------------------------------------------------------------
    # 1. Validate the invitation token
    # ------------------------------------------------------------------

    invitation = get_invitation_by_token(
        db=db,
        raw_token=token,
    )

    if invitation is None:
        raise ValueError(
            "This invitation is invalid, expired, revoked, "
            "or already accepted."
        )

    # ------------------------------------------------------------------
    # 2. Load the Guardian
    # ------------------------------------------------------------------

    guardian = db.scalar(
        select(Guardian).where(
            Guardian.id == invitation.guardian_id,
        )
    )

    if guardian is None:
        raise ValueError("Guardian record no longer exists.")

    if guardian.user_id:
        raise ValueError(
            "This Guardian already has an account."
        )

    if guardian.status != "active":
        raise ValueError(
            "This Guardian account is not active."
        )

    # ------------------------------------------------------------------
    # 3. Invitation must have an email
    # ------------------------------------------------------------------

    if not invitation.invited_email:
        raise ValueError(
            "This Guardian invitation does not have an email address."
        )

    email = invitation.invited_email.strip().lower()

    # ------------------------------------------------------------------
    # 4. Prevent duplicate User accounts
    # ------------------------------------------------------------------

    existing_user = db.scalar(
        select(User).where(
            User.email == email,
        )
    )

    if existing_user is not None:
        raise ValueError(
            "An account with this invitation email already exists."
        )

    # ------------------------------------------------------------------
    # 5. Create the Guardian's User account
    # ------------------------------------------------------------------

    user = User(
        email=email,
        password_hash=hash_password(request.password),
        full_name=request.full_name.strip(),
    )

    db.add(user)
    db.flush()

    # ------------------------------------------------------------------
    # 6. Link User → Guardian
    # ------------------------------------------------------------------

    guardian.user_id = user.id

    # ------------------------------------------------------------------
    # 7. Mark invitation as accepted
    # ------------------------------------------------------------------

    from datetime import datetime, timezone

    invitation.status = "accepted"
    invitation.accepted_at = datetime.now(timezone.utc)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError(
            "Unable to create the Guardian account. "
            "The invitation may already have been used."
        ) from exc

    db.refresh(user)
    db.refresh(guardian)

    return GuardianInvitationAcceptResponse(
        success=True,
        message="Guardian account created successfully.",
        user_id=user.id,
        guardian_id=guardian.id,
        email=user.email,
        full_name=user.full_name,
    )