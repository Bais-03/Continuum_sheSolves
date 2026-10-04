"""
conftest.py — Pytest fixtures for Continuum backend tests.
"""
import pytest
import pytest_asyncio

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def _set_fk_pragma(dbapi_conn, _record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(autouse=True)
def clean_tables(setup_test_db):
    yield
    db = TestSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

SIGNUP_PAYLOAD = {
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "securepassword123",
}

@pytest_asyncio.fixture
async def signed_up_client(client):
    resp = await client.post("/api/v1/auth/signup", json=SIGNUP_PAYLOAD)
    assert resp.status_code == 201, resp.text
    return client, resp.json()
