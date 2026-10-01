"""
test_auth.py — Auth endpoint tests.

Covers
------
* Successful signup creates user + household
* Duplicate signup returns 409
* Password is never stored in plaintext
* Successful login sets cookie
* Wrong password returns 401
* Logout clears cookie (requires CSRF)
* Missing authentication returns 401
* Invalid JWT returns 401
* Expired JWT returns 401
* /auth/me returns correct profile when authenticated
* Health endpoint
* DB transaction rollback on failure (simulated via duplicate)
"""
import time
from datetime import timedelta

import pytest
import jwt

from app.config import settings
from app.services.auth_service import create_access_token

pytestmark = pytest.mark.anyio

SIGNUP = {
    "full_name": "Anil Kulkarni",
    "email": "anil@example.com",
    "password": "securepass123",
}


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
async def test_health(client):
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


# ---------------------------------------------------------------------------
# Signup
# ---------------------------------------------------------------------------
async def test_signup_success(client):
    r = await client.post("/api/v1/auth/signup", json=SIGNUP)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == SIGNUP["email"]
    assert data["full_name"] == SIGNUP["full_name"]
    assert "household_id" in data
    assert data["household_id"] is not None
    # Cookie must be set
    assert settings.COOKIE_NAME in r.cookies


async def test_signup_duplicate_email(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r2 = await client.post("/api/v1/auth/signup", json=SIGNUP)
    assert r2.status_code == 409


async def test_signup_email_case_normalised(client):
    """Upper-case email on signup → same user as lower-case."""
    payload = {**SIGNUP, "email": "ANIL@EXAMPLE.COM"}
    r = await client.post("/api/v1/auth/signup", json=payload)
    assert r.status_code == 201
    assert r.json()["email"] == "anil@example.com"


async def test_signup_weak_password(client):
    r = await client.post("/api/v1/auth/signup", json={**SIGNUP, "password": "short"})
    assert r.status_code == 422


async def test_signup_missing_field(client):
    r = await client.post("/api/v1/auth/signup", json={"email": "x@x.com"})
    assert r.status_code == 422


async def test_password_not_stored_plaintext(client):
    """Verify that the raw password does not appear in the DB."""
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    # Query DB directly
    from tests.conftest import TestSessionLocal
    from app.models.user import User
    db = TestSessionLocal()
    user = db.query(User).filter(User.email == SIGNUP["email"]).first()
    db.close()
    assert user is not None
    assert user.password_hash != SIGNUP["password"]
    assert SIGNUP["password"] not in user.password_hash


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
async def test_login_success(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP["email"], "password": SIGNUP["password"]},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == SIGNUP["email"]
    assert settings.COOKIE_NAME in r.cookies


async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP["email"], "password": "wrongpassword"},
    )
    assert r.status_code == 401


async def test_login_unknown_email(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert r.status_code == 401


async def test_login_response_has_no_password_hash(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": SIGNUP["email"], "password": SIGNUP["password"]},
    )
    body = r.text
    assert "password_hash" not in body
    assert SIGNUP["password"] not in body


# ---------------------------------------------------------------------------
# /auth/me
# ---------------------------------------------------------------------------
async def test_me_authenticated(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == SIGNUP["email"]
    assert data["full_name"] == SIGNUP["full_name"]
    assert data["household_id"] is not None


async def test_me_unauthenticated(client):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


async def test_me_invalid_jwt(client):
    client.cookies.set(settings.COOKIE_NAME, "this.is.not.a.valid.jwt")
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


async def test_me_expired_jwt(client):
    expired_token = create_access_token(
        subject="fake-user-id", expires_delta=timedelta(seconds=-1)
    )
    client.cookies.set(settings.COOKIE_NAME, expired_token)
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
async def test_logout_clears_cookie(client):
    # Sign up (sets cookies on client)
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    # Read the CSRF token from the cookie jar
    csrf = client.cookies.get(settings.CSRF_COOKIE_NAME)
    assert csrf is not None

    r = await client.post(
        "/api/v1/auth/logout",
        headers={settings.CSRF_HEADER_NAME: csrf},
    )
    assert r.status_code == 204
    # After logout, /me must reject
    r2 = await client.get("/api/v1/auth/me")
    assert r2.status_code == 401


async def test_logout_missing_csrf(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.post("/api/v1/auth/logout")  # no CSRF header
    assert r.status_code == 403


async def test_logout_wrong_csrf(client):
    await client.post("/api/v1/auth/signup", json=SIGNUP)
    r = await client.post(
        "/api/v1/auth/logout",
        headers={settings.CSRF_HEADER_NAME: "wrong_token_value"},
    )
    assert r.status_code == 403
