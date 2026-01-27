import pytest
import pytest_asyncio
import os
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.core.config import get_settings

# Use a test database URL - can be overridden by env var
# Default to SQLite for fast local testing if Postgres not available
# But we prefer Postgres if TEST_DATABASE_URL is set
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///./test.db"
)

@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create a single engine for the test session"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

    # Cleanup SQLite file if used
    if "sqlite" in TEST_DATABASE_URL and os.path.exists("./test.db"):
        os.remove("./test.db")

@pytest_asyncio.fixture
async def db_session(engine):
    """
    Create a new database session for a test.
    Rolls back transaction at the end to ensure isolation.
    """
    connection = await engine.connect()
    transaction = await connection.begin()

    session_factory = async_sessionmaker(bind=connection, class_=AsyncSession, expire_on_commit=False)
    session = session_factory()

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()

@pytest_asyncio.fixture
async def client(db_session):
    """
    Create a test client with overridden database dependency.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # Use ASGITransport for direct app testing without running server
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def disable_rate_limiting():
    """Disable rate limiting for all tests"""
    from app.core.rate_limit import rate_limit_auth, rate_limit_api, rate_limit_file_upload

    async def mock_rate_limit():
        return None

    app.dependency_overrides[rate_limit_auth] = mock_rate_limit
    app.dependency_overrides[rate_limit_api] = mock_rate_limit
    app.dependency_overrides[rate_limit_file_upload] = mock_rate_limit

    yield

    app.dependency_overrides.pop(rate_limit_auth, None)
    app.dependency_overrides.pop(rate_limit_api, None)
    app.dependency_overrides.pop(rate_limit_file_upload, None)
