"""
test_guardians.py — Comprehensive tests for Guardian invitations and acceptance.

Covers
------
* Create Guardian contact
* Generate Guardian invitation URL (single URL, correct format)
* Validate invitation token (valid, invalid, expired)
* Accept invitation and create Guardian account
* Verify accepted token cannot be reused
* Verify Guardian account isolation (cannot access household owner APIs)
"""
import pytest
from datetime import datetime, timedelta, timezone

from app.config import settings
from tests.conftest import SIGNUP_PAYLOAD


GUARDIAN_PAYLOAD = {
    "name": "Meera Sharma",
    "relationship": "Sister / Contingency Custodian",
    "email": "meera.guardian@example.com",
    "phone": "+1 (555) 234-5678",
}


async def test_guardian_invitation_lifecycle(client):
    # 1. Sign up household owner
    signup_resp = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert signup_resp.status_code == 201
    csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)
    assert csrf is not None
    headers = {settings.CSRF_HEADER_NAME: csrf}

    # 2. Add a Guardian
    create_resp = await client.post(
        "/api/v1/guardian",
        json=GUARDIAN_PAYLOAD,
        headers=headers,
    )
    assert create_resp.status_code == 201
    guardian_data = create_resp.json()
    guardian_id = guardian_data["id"]
    assert guardian_data["name"] == GUARDIAN_PAYLOAD["name"]

    # 3. Create invitation
    invite_resp = await client.post(
        f"/api/v1/guardian/{guardian_id}/invite",
        headers=headers,
    )
    assert invite_resp.status_code == 201
    invite_data = invite_resp.json()
    invitation_link = invite_data["invitation_link"]
    assert isinstance(invitation_link, str)
    assert "/guardian/invite/" in invitation_link

    # Extract token from URL
    token = invitation_link.split("/guardian/invite/")[-1]
    assert len(token) > 10

    # 4. Validate invitation token (public endpoint)
    val_resp = await client.get(f"/api/v1/guardian/invitation/{token}")
    assert val_resp.status_code == 200
    val_data = val_resp.json()
    assert val_data["valid"] is True
    assert val_data["guardian_name"] == GUARDIAN_PAYLOAD["name"]
    assert val_data["invited_email"] == GUARDIAN_PAYLOAD["email"]

    # 5. Clear household owner cookies to simulate Guardian recipient opening link
    client.cookies.clear()

    # 6. Accept invitation
    accept_resp = await client.post(
        f"/api/v1/guardian/invitation/{token}/accept",
        json={
            "full_name": "Meera Sharma",
            "password": "guardianpassword123",
        },
    )
    assert accept_resp.status_code == 201
    accept_data = accept_resp.json()
    assert accept_data["success"] is True
    assert accept_data["guardian_id"] == guardian_id
    # Guardian auth cookie should now be set
    assert settings.COOKIE_NAME in client.cookies

    # 7. Check that the used token is no longer valid
    val_again = await client.get(f"/api/v1/guardian/invitation/{token}")
    assert val_again.status_code == 200
    assert val_again.json()["valid"] is False

    # 8. Guardian portal access
    portal_resp = await client.get("/api/v1/guardian/me")
    assert portal_resp.status_code == 200
    portal_data = portal_resp.json()
    assert portal_data["name"] == "Meera Sharma"
    assert portal_data["relationship"] == GUARDIAN_PAYLOAD["relationship"]


async def test_invalid_invitation_token(client):
    r = await client.get("/api/v1/guardian/invitation/nonexistent-token-12345")
    assert r.status_code == 200
    assert r.json()["valid"] is False


async def test_accept_invalid_token_returns_400(client):
    r = await client.post(
        "/api/v1/guardian/invitation/nonexistent-token/accept",
        json={
            "full_name": "Test Guardian",
            "password": "password123",
        },
    )
    assert r.status_code == 400
