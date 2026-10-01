"""
conftest.py — Pytest fixtures for Continuum backend tests.

* A fresh file-based SQLite database is created per test session (test_continuum.db).
* All tables are created via SQLAlchemy metadata (no Alembic required in tests).
* The FastAPI app's `get_db` dependency is overridden to use the test DB.
* HTTPX AsyncClient is used through ASGITransport — no real server is started.
* Tables are truncated before each test for full isolation.
"""
import asyncio
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# ---------------------------------------------------------------------------
# Test database (separate file, not the dev DB)
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite:///./test_continuum.db"

test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ---------------------------------------------------------------------------
# Create tables once; drop after the entire session
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    # Remove the test DB file so reruns start clean
    if os.path.exists("test_continuum.db"):
        os.remove("test_continuum.db")


# ---------------------------------------------------------------------------
# Truncate all tables before each test
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Async HTTP client — one per test function
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
