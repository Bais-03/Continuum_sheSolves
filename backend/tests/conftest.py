"""
conftest.py — Pytest fixtures for Continuum backend tests.

Strategy
--------
* Uses a StaticPool in-memory SQLite database so all connections (session-scoped
  setup, per-test client, teardown) share the same in-memory database instance.
  Without StaticPool each new connection() call to sqlite:///:memory: creates
  a fresh, empty database — which causes "no such table" errors.
* Tables are created once per session via SQLAlchemy metadata (no Alembic needed).
* The FastAPI app's `get_db` dependency is overridden to use the test session.
* All rows are deleted before each test for full isolation.
* HTTPX AsyncClient uses ASGITransport — no real HTTP server is started.
* pytest-asyncio with asyncio_mode = auto (set in pytest.ini) means all async
  test functions run automatically without @pytest.mark.asyncio.
"""
import pytest
import pytest_asyncio

from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import app first so all models are registered on Base.metadata before
# create_all is called.
from app.main import app
from app.db.base import Base
from app.db.session import get_db

# ---------------------------------------------------------------------------
# Shared in-memory SQLite engine using StaticPool.
# StaticPool reuses the same underlying connection for every engine.connect()
# call, so tables created in setup_test_db are visible to all test sessions.
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Create all tables once for the entire test session.
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


# ---------------------------------------------------------------------------
# Delete all rows before each test for full isolation.
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
# Async HTTP client — one fresh client per test.
# Cookies set by server responses are automatically stored in the cookie jar.
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
