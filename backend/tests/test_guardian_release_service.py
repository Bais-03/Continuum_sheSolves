
from datetime import datetime, timedelta
from uuid import uuid4

import pytest

from app.models.guardian import Guardian
from app.models.household import Household
from app.models.guardian_release import (
    GuardianReleaseApproval,
    GuardianReleaseRequest,
)
from app.models.user import User
from app.services.guardian_release_service import (
    approve_release_request,
    get_guardian_pending_requests,
)


@pytest.mark.asyncio
async def test_release_requires_two_guardian_approvals(signed_up_client):
    client, signup_data = signed_up_client

    from tests.conftest import TestSessionLocal

    db = TestSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == signup_data["email"]
        ).first()
        assert user is not None

        household = Household(
            name="Release Test Household",
            owner_id=user.id,
        )
        db.add(household)
        db.flush()

        guardian_one = Guardian(
            household_id=household.id,
            name="Guardian One",
            relationship_type="family",
            status="active",
        )
        guardian_two = Guardian(
            household_id=household.id,
            name="Guardian Two",
            relationship_type="family",
            status="active",
        )
        db.add_all([guardian_one, guardian_two])
        db.commit()

        from app.services.guardian_release_service import create_release_request

        request = create_release_request(
            db=db,
            household_id=household.id,
            initiated_by=user.id,
            reason="Verify two-person approval",
        )

        first_result = approve_release_request(
            db=db,
            release_request_id=request.id,
            guardian_id=guardian_one.id,
        )
        assert first_result.status == "pending"
        assert first_result.released_at is None

        second_result = approve_release_request(
            db=db,
            release_request_id=request.id,
            guardian_id=guardian_two.id,
        )
        assert second_result.status == "released"
        assert second_result.released_at is not None

    finally:
        db.close()


@pytest.mark.asyncio
async def test_expired_request_is_not_returned_as_pending(signed_up_client):
    client, signup_data = signed_up_client

    from tests.conftest import TestSessionLocal

    db = TestSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == signup_data["email"]
        ).first()
        assert user is not None

        household = Household(
            name="Expired Release Test Household",
            owner_id=user.id,
        )
        db.add(household)
        db.flush()

        guardian = Guardian(
            household_id=household.id,
            name="Expired Test Guardian",
            relationship_type="family",
            status="active",
        )
        db.add(guardian)
        db.flush()

        now = datetime.utcnow()
        request = GuardianReleaseRequest(
            id=str(uuid4()),
            household_id=household.id,
            initiated_by=user.id,
            status="pending",
            threshold=2,
            created_at=now - timedelta(hours=50),
            expires_at=now - timedelta(hours=2),
        )
        db.add(request)
        db.flush()

        approval = GuardianReleaseApproval(
            id=str(uuid4()),
            release_request_id=request.id,
            guardian_id=guardian.id,
            status="pending",
            created_at=now - timedelta(hours=50),
        )
        db.add(approval)
        db.commit()

        pending_requests = get_guardian_pending_requests(
            db=db,
            guardian_id=guardian.id,
        )

        assert request.id not in {
            item.id for item in pending_requests
        }
        db.refresh(request)
        assert request.status == "expired"

    finally:
        db.close()