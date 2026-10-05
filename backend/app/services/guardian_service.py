from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.guardian import Guardian
from app.schemas.guardian import (
    GuardianConfigResponse,
    GuardianCreateRequest,
    GuardianInfo,
    GuardianReleaseRequest,
    GuardianReleaseResponse,
    GuardianUpdateRequest,
)


THRESHOLD = 2


def _to_guardian_info(guardian: Guardian) -> GuardianInfo:
    """Convert a database Guardian model into an API response object."""
    return GuardianInfo(
        id=guardian.id,
        name=guardian.name,
        relationship=guardian.relationship_type,
        email=guardian.email,
        phone=guardian.phone,
        status=guardian.status,
    )


def get_guardian_config(
    db: Session,
    household_id: str,
) -> GuardianConfigResponse:
    """Return Guardian configuration for the authenticated household."""

    guardians = list(
        db.scalars(
            select(Guardian)
            .where(Guardian.household_id == household_id)
            .order_by(Guardian.created_at)
        )
    )

    return GuardianConfigResponse(
        guardians=[_to_guardian_info(guardian) for guardian in guardians],
        threshold=THRESHOLD,
        total_guardians=len(guardians),
        status="configured" if guardians else "not_configured",
    )


def create_guardian(
    db: Session,
    household_id: str,
    request: GuardianCreateRequest,
) -> GuardianInfo:
    """Create a new Guardian for the authenticated household."""

    guardian = Guardian(
        household_id=household_id,
        name=request.name,
        email=str(request.email) if request.email else None,
        phone=request.phone,
        relationship_type=request.relationship,
        status="active",
    )

    db.add(guardian)
    db.commit()
    db.refresh(guardian)

    return _to_guardian_info(guardian)


def update_guardian(
    db: Session,
    household_id: str,
    guardian_id: str,
    request: GuardianUpdateRequest,
) -> GuardianInfo | None:
    """Update a Guardian belonging to the authenticated household."""

    guardian = db.scalar(
        select(Guardian).where(
            Guardian.id == guardian_id,
            Guardian.household_id == household_id,
        )
    )

    if guardian is None:
        return None

    if request.name is not None:
        guardian.name = request.name

    if request.relationship is not None:
        guardian.relationship_type = request.relationship

    if request.email is not None:
        guardian.email = str(request.email)

    if request.phone is not None:
        guardian.phone = request.phone

    if request.status is not None:
        guardian.status = request.status

    db.commit()
    db.refresh(guardian)

    return _to_guardian_info(guardian)


def delete_guardian(
    db: Session,
    household_id: str,
    guardian_id: str,
) -> bool:
    """Delete a Guardian belonging to the authenticated household."""

    guardian = db.scalar(
        select(Guardian).where(
            Guardian.id == guardian_id,
            Guardian.household_id == household_id,
        )
    )

    if guardian is None:
        return False

    db.delete(guardian)
    db.commit()

    return True


def release_guardian_vault(
    db: Session,
    household_id: str,
    request: GuardianReleaseRequest,
) -> GuardianReleaseResponse:
    """Simulate a 2-of-3 Guardian vault release."""

    selected_ids = list(dict.fromkeys(request.guardian_ids))

    if len(selected_ids) < THRESHOLD:
        return GuardianReleaseResponse(
            success=False,
            message=f"At least {THRESHOLD} Guardians are required.",
            released_by=selected_ids,
            threshold=THRESHOLD,
        )

    guardians = list(
        db.scalars(
            select(Guardian).where(
                Guardian.household_id == household_id,
                Guardian.id.in_(selected_ids),
                Guardian.status == "active",
            )
        )
    )

    valid_ids = {guardian.id for guardian in guardians}

    if len(valid_ids) != len(selected_ids):
        return GuardianReleaseResponse(
            success=False,
            message="One or more selected Guardians are invalid or inactive.",
            released_by=selected_ids,
            threshold=THRESHOLD,
        )

    return GuardianReleaseResponse(
        success=True,
        message=(
            "Guardian threshold satisfied. "
            "Vault release simulated successfully."
        ),
        released_by=selected_ids,
        threshold=THRESHOLD,
    )