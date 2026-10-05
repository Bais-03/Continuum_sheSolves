from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.guardian import Guardian
from app.models.guardian_release import (
    GuardianReleaseApproval,
    GuardianReleaseRequest,
)


THRESHOLD = 2
REQUEST_EXPIRY_HOURS = 48


def create_release_request(
    db: Session,
    household_id: str,
    initiated_by: str,
    reason: Optional[str] = None,
) -> GuardianReleaseRequest:
    """
    Create a new Guardian release request for a household.

    The request is assigned to all active guardians in the household.
    The request becomes releasable once the configured threshold is reached.
    """

    # Prevent multiple active release requests for the same household.
    existing_request = (
        db.query(GuardianReleaseRequest)
        .filter(
            GuardianReleaseRequest.household_id == household_id,
            GuardianReleaseRequest.status == "pending",
        )
        .first()
    )

    if existing_request:
        raise ValueError(
            "A release request is already pending for this household."
        )

    # Get all active guardians belonging to this household.
    guardians = (
        db.query(Guardian)
        .filter(
            Guardian.household_id == household_id,
            Guardian.status == "active",
        )
        .all()
    )

    if len(guardians) < THRESHOLD:
        raise ValueError(
            f"At least {THRESHOLD} active guardians are required "
            "to create a release request."
        )

    now = datetime.utcnow()

    release_request = GuardianReleaseRequest(
        id=str(uuid4()),
        household_id=household_id,
        initiated_by=initiated_by,
        status="pending",
        threshold=THRESHOLD,
        reason=reason,
        created_at=now,
        expires_at=now + timedelta(hours=REQUEST_EXPIRY_HOURS),
    )

    db.add(release_request)
    db.flush()

    # Create one approval record for every active guardian.
    for guardian in guardians:
        approval = GuardianReleaseApproval(
            id=str(uuid4()),
            release_request_id=release_request.id,
            guardian_id=guardian.id,
            status="pending",
            created_at=now,
        )

        db.add(approval)

    db.commit()
    db.refresh(release_request)

    return release_request


def get_release_request(
    db: Session,
    release_request_id: str,
) -> Optional[GuardianReleaseRequest]:
    """Return a release request by ID."""

    return (
        db.query(GuardianReleaseRequest)
        .filter(
            GuardianReleaseRequest.id == release_request_id
        )
        .first()
    )


def get_household_release_requests(
    db: Session,
    household_id: str,
) -> list[GuardianReleaseRequest]:
    """Return release requests belonging to a household."""

    return (
        db.query(GuardianReleaseRequest)
        .filter(
            GuardianReleaseRequest.household_id == household_id
        )
        .order_by(
            GuardianReleaseRequest.created_at.desc()
        )
        .all()
    )


def get_guardian_pending_requests(
    db: Session,
    guardian_id: str,
) -> list[GuardianReleaseRequest]:
    """
    Return pending release requests assigned to a Guardian.
    """

    return (
        db.query(GuardianReleaseRequest)
        .join(
            GuardianReleaseApproval,
            GuardianReleaseApproval.release_request_id
            == GuardianReleaseRequest.id,
        )
        .filter(
            GuardianReleaseApproval.guardian_id == guardian_id,
            GuardianReleaseApproval.status == "pending",
            GuardianReleaseRequest.status == "pending",
        )
        .order_by(
            GuardianReleaseRequest.created_at.desc()
        )
        .all()
    )


def approve_release_request(
    db: Session,
    release_request_id: str,
    guardian_id: str,
) -> GuardianReleaseRequest:
    """
    Approve a release request as a specific Guardian.

    If the number of approvals reaches the threshold,
    the release request is marked as released.
    """

    release_request = (
        db.query(GuardianReleaseRequest)
        .filter(
            GuardianReleaseRequest.id == release_request_id
        )
        .first()
    )

    if not release_request:
        raise ValueError("Release request not found.")

    if release_request.status != "pending":
        raise ValueError(
            "This release request is no longer pending."
        )

    # Check expiry.
    if (
        release_request.expires_at
        and datetime.utcnow() > release_request.expires_at
    ):
        release_request.status = "expired"
        db.commit()

        raise ValueError(
            "This release request has expired."
        )

    # Find this Guardian's approval record.
    approval = (
        db.query(GuardianReleaseApproval)
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.guardian_id
            == guardian_id,
        )
        .first()
    )

    if not approval:
        raise ValueError(
            "This Guardian is not assigned to this release request."
        )

    if approval.status != "pending":
        raise ValueError(
            "This Guardian has already responded to this request."
        )

    # Record approval.
    approval.status = "approved"
    approval.responded_at = datetime.utcnow()

    db.flush()

    # Count approved Guardians.
    approved_count = (
        db.query(func.count(GuardianReleaseApproval.id))
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.status == "approved",
        )
        .scalar()
    )

    if approved_count >= release_request.threshold:
        release_request.status = "released"
        release_request.released_at = datetime.utcnow()

    db.commit()
    db.refresh(release_request)

    return release_request


def reject_release_request(
    db: Session,
    release_request_id: str,
    guardian_id: str,
) -> GuardianReleaseRequest:
    """
    Reject a release request as a specific Guardian.

    A rejection does not automatically cancel the request because
    another Guardian may still provide the required approvals.
    """

    release_request = (
        db.query(GuardianReleaseRequest)
        .filter(
            GuardianReleaseRequest.id == release_request_id
        )
        .first()
    )

    if not release_request:
        raise ValueError("Release request not found.")

    if release_request.status != "pending":
        raise ValueError(
            "This release request is no longer pending."
        )

    # Check expiry.
    if (
        release_request.expires_at
        and datetime.utcnow() > release_request.expires_at
    ):
        release_request.status = "expired"
        db.commit()

        raise ValueError(
            "This release request has expired."
        )

    # Find this Guardian's approval record.
    approval = (
        db.query(GuardianReleaseApproval)
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.guardian_id
            == guardian_id,
        )
        .first()
    )

    if not approval:
        raise ValueError(
            "This Guardian is not assigned to this release request."
        )

    if approval.status != "pending":
        raise ValueError(
            "This Guardian has already responded to this request."
        )

    approval.status = "rejected"
    approval.responded_at = datetime.utcnow()

    db.commit()
    db.refresh(release_request)

    return release_request


def expire_release_request(
    db: Session,
    release_request: GuardianReleaseRequest,
) -> GuardianReleaseRequest:
    """Mark a pending release request as expired."""

    if release_request.status == "pending":
        release_request.status = "expired"
        db.commit()
        db.refresh(release_request)

    return release_request


def count_approvals(
    db: Session,
    release_request_id: str,
) -> dict[str, int]:
    """Return approval statistics for a release request."""

    approved = (
        db.query(func.count(GuardianReleaseApproval.id))
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.status == "approved",
        )
        .scalar()
        or 0
    )

    rejected = (
        db.query(func.count(GuardianReleaseApproval.id))
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.status == "rejected",
        )
        .scalar()
        or 0
    )

    pending = (
        db.query(func.count(GuardianReleaseApproval.id))
        .filter(
            GuardianReleaseApproval.release_request_id
            == release_request_id,
            GuardianReleaseApproval.status == "pending",
        )
        .scalar()
        or 0
    )

    return {
        "approved": approved,
        "rejected": rejected,
        "pending": pending,
        "threshold": THRESHOLD,
    }