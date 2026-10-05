from sqlalchemy.orm import Session

from app.models.guardian import Guardian
from app.schemas.guardian_portal import GuardianPortalResponse


THRESHOLD = 2


def get_guardian_portal(
    db: Session,
    user_id: str,
) -> GuardianPortalResponse | None:
    """
    Return the Guardian portal information for the authenticated Guardian.

    The Guardian is identified by Guardian.user_id, never by a
    guardian_id supplied by the client.
    """

    guardian = (
        db.query(Guardian)
        .filter(
            Guardian.user_id == user_id,
            Guardian.status == "active",
        )
        .first()
    )

    if guardian is None:
        return None

    total_guardians = (
        db.query(Guardian)
        .filter(
            Guardian.household_id == guardian.household_id,
            Guardian.status == "active",
        )
        .count()
    )

    return GuardianPortalResponse(
        guardian_id=guardian.id,
        name=guardian.name,
        relationship=guardian.relationship_type,
        email=guardian.email,
        phone=guardian.phone,
        status=guardian.status,
        threshold=THRESHOLD,
        total_guardians=total_guardians,
        responsibility=(
            "Participate in the controlled Guardian release process "
            "when required."
        ),
        access_level="restricted",
    )