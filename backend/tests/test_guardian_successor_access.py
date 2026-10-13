
from datetime import datetime, timezone
import uuid

import pytest

from tests.conftest import TestSessionLocal
from app.models.domain import Document, ExtractedField
from app.models.guardian import Guardian
from app.models.guardian_release import (
    GuardianReleaseApproval,
    GuardianReleaseRequest,
)
from app.models.user import User


def _id():
    return str(uuid.uuid4())


async def _create_released_request(client, status="released", approval_status="approved"):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={
            "full_name": "Successor Test User",
            "email": "successor-test@example.com",
            "password": "securepassword123",
        },
    )
    assert signup.status_code == 201, signup.text

    household_id = signup.json()["household_id"]
    db = TestSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == "successor-test@example.com"
        ).first()
        assert user is not None

        guardian = Guardian(
            id=_id(),
            household_id=household_id,
            user_id=user.id,
            name="Test Guardian",
            relationship_type="family",
            status="active",
        )
        db.add(guardian)
        db.flush()

        now = datetime.now(timezone.utc)
        request_id = _id()

        release_request = GuardianReleaseRequest(
            id=request_id,
            household_id=household_id,
            initiated_by=user.id,
            status=status,
            threshold=2,
            created_at=now,
            expires_at=None,
            released_at=now if status == "released" else None,
        )
        db.add(release_request)
        db.flush()

        db.add(
            GuardianReleaseApproval(
                id=_id(),
                release_request_id=request_id,
                guardian_id=guardian.id,
                status=approval_status,
                created_at=now,
                responded_at=now if approval_status == "approved" else None,
            )
        )

        document = Document(
            id=_id(),
            household_id=household_id,
            filename="family-record.txt",
            document_type="family_record",
            storage_reference="private://must-not-be-returned",
            upload_status="COMPLETE",
        )
        db.add(document)
        db.flush()

        db.add_all([
            ExtractedField(
                id=_id(),
                document_id=document.id,
                field_label="Policy Holder",
                extracted_value="Renuka Bais",
                readiness_dimension="beneficiary",
                confirmation_status="CONFIRMED",
            ),
            ExtractedField(
                id=_id(),
                document_id=document.id,
                field_label="Unverified Value",
                extracted_value="Do not disclose",
                readiness_dimension="asset",
                confirmation_status="UNCONFIRMED",
            ),
            ExtractedField(
                id=_id(),
                document_id=document.id,
                field_label="Empty Confirmed Value",
                extracted_value="   ",
                readiness_dimension="asset",
                confirmation_status="CONFIRMED",
            ),
        ])
        db.commit()

        return request_id
    finally:
        db.close()


@pytest.mark.asyncio
async def test_successor_data_returns_only_confirmed_nonempty_fields(client):
    request_id = await _create_released_request(client)

    response = await client.get(
        f"/api/v1/guardian/release-requests/{request_id}/successor-data"
    )

    assert response.status_code == 200, response.text
    body = response.json()

    assert body["release_request_id"] == request_id
    assert body["release_status"] == "released"
    assert len(body["documents"]) == 1

    document = body["documents"][0]
    assert document["filename"] == "family-record.txt"
    assert "storage_reference" not in document

    assert document["fields"] == [
        {
            "field_label": "Policy Holder",
            "extracted_value": "Renuka Bais",
            "readiness_dimension": "beneficiary",
        }
    ]


@pytest.mark.asyncio
async def test_successor_data_denied_before_release(client):
    request_id = await _create_released_request(
        client,
        status="pending",
        approval_status="approved",
    )

    response = await client.get(
        f"/api/v1/guardian/release-requests/{request_id}/successor-data"
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_successor_data_denied_to_non_approving_guardian(client):
    request_id = await _create_released_request(
        client,
        status="released",
        approval_status="pending",
    )

    response = await client.get(
        f"/api/v1/guardian/release-requests/{request_id}/successor-data"
    )

    assert response.status_code == 403
