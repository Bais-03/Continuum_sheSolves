import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.guardian import Guardian
from app.models.guardian_invitation import GuardianInvitation


INVITATION_EXPIRY_HOURS = 48


def _hash_token(token: str) -> str:
    """Return a SHA-256 hash of an invitation token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _now() -> datetime:
    """Return the current UTC time."""
    return datetime.now(timezone.utc)


def _is_expired(invitation: GuardianInvitation) -> bool:
    """Check whether an invitation has expired."""
    expires_at = invitation.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return expires_at <= _now()


def create_guardian_invitation(
    db: Session,
    household_id: str,
    guardian_id: str,
) -> tuple[GuardianInvitation, str]:
    """
    Create a new invitation for a Guardian.

    Returns:
        (invitation, raw_token)

    The raw token is returned only so the API can build the
    invitation link. Only its hash is stored in the database.
    """

    guardian = db.scalar(
        select(Guardian).where(
            Guardian.id == guardian_id,
            Guardian.household_id == household_id,
        )
    )

    if guardian is None:
        raise ValueError("Guardian not found.")

    if guardian.user_id:
        raise ValueError("This Guardian already has an account.")

    # Revoke any existing pending invitations for this Guardian.
    existing_invitations = list(
        db.scalars(
            select(GuardianInvitation).where(
                GuardianInvitation.guardian_id == guardian_id,
                GuardianInvitation.status == "pending",
            )
        )
    )

    for invitation in existing_invitations:
        invitation.status = "revoked"

    # Generate a cryptographically secure token.
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)

    invitation = GuardianInvitation(
        guardian_id=guardian.id,
        token_hash=token_hash,
        invited_email=guardian.email,
        status="pending",
        expires_at=_now() + timedelta(hours=INVITATION_EXPIRY_HOURS),
    )

    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return invitation, raw_token


def get_invitation_by_token(
    db: Session,
    raw_token: str,
) -> Optional[GuardianInvitation]:
    """
    Find a valid pending invitation using the raw token.

    Expired invitations are automatically marked as expired.
    """

    token_hash = _hash_token(raw_token)

    invitation = db.scalar(
        select(GuardianInvitation).where(
            GuardianInvitation.token_hash == token_hash,
        )
    )

    if invitation is None:
        return None

    if invitation.status != "pending":
        return None

    if _is_expired(invitation):
        invitation.status = "expired"
        db.commit()
        return None

    return invitation


def accept_guardian_invitation(
    db: Session,
    invitation: GuardianInvitation,
) -> GuardianInvitation:
    """
    Mark an invitation as accepted.

    Account creation and Guardian-to-User linking will be handled
    by the Guardian acceptance endpoint/service later.
    """

    if invitation.status != "pending":
        raise ValueError("Invitation is no longer pending.")

    if _is_expired(invitation):
        invitation.status = "expired"
        db.commit()
        raise ValueError("Invitation has expired.")

    invitation.status = "accepted"
    invitation.accepted_at = _now()

    db.commit()
    db.refresh(invitation)

    return invitation


def revoke_guardian_invitation(
    db: Session,
    household_id: str,
    invitation_id: str,
) -> bool:
    """Revoke a pending Guardian invitation."""

    invitation = db.scalar(
        select(GuardianInvitation)
        .join(Guardian, Guardian.id == GuardianInvitation.guardian_id)
        .where(
            GuardianInvitation.id == invitation_id,
            Guardian.household_id == household_id,
        )
    )

    if invitation is None:
        return False

    if invitation.status != "pending":
        return False

    invitation.status = "revoked"

    db.commit()

    return True