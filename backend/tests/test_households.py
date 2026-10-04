"""
test_households.py — Household endpoint tests.

Covers
------
* Household created on signup
* GET /households/me returns correct data for owner
* Members are included in response
* Unauthenticated request returns 401
* Household data isolation between users
"""
import pytest

from app.config import settings


USER_A = {
    "full_name": "Anil Kulkarni",
    "email": "anil@example.com",
    "password": "securepass123",
}
USER_B = {
    "full_name": "Meera Rajan",
    "email": "meera@example.com",
    "password": "anotherpass456",
}


async def test_household_created_on_signup(client):
    r = await client.post("/api/v1/auth/signup", json=USER_A)
    assert r.status_code == 201
    assert r.json()["household_id"] is not None


async def test_get_my_household(client):
    await client.post("/api/v1/auth/signup", json=USER_A)
    r = await client.get("/api/v1/households/me")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    assert "name" in data
    assert "members" in data
    # Primary member must exist
    assert len(data["members"]) >= 1
    primary = data["members"][0]
    assert primary["role"] == "Primary"
    assert primary["name"] == USER_A["full_name"]


async def test_household_unauthenticated(client):
    r = await client.get("/api/v1/households/me")
    assert r.status_code == 401


async def test_household_isolation(client):
    """User A must not see User B's household."""
    # Sign up user A — cookies set on client
    await client.post("/api/v1/auth/signup", json=USER_A)
    r_a = await client.get("/api/v1/households/me")
    assert r_a.status_code == 200
    hh_a_id = r_a.json()["id"]

    # Clear cookies and sign up as user B
    client.cookies.clear()
    await client.post("/api/v1/auth/signup", json=USER_B)
    r_b = await client.get("/api/v1/households/me")
    assert r_b.status_code == 200
    hh_b_id = r_b.json()["id"]

    assert hh_a_id != hh_b_id


async def test_household_name_derived_from_user(client):
    await client.post("/api/v1/auth/signup", json=USER_A)
    r = await client.get("/api/v1/households/me")
    data = r.json()
    # Name should contain the first word of full_name
    assert USER_A["full_name"].split()[0] in data["name"]
