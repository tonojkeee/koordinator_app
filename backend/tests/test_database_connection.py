import pytest
from app.modules.auth.models import User
from sqlalchemy import select

@pytest.mark.asyncio
async def test_database_connection(db_session):
    """Verify database connection and session handling"""
    # Create a test user
    user = User(
        username="test_user",
        email="test@example.com",
        hashed_password="hashed_secret",
        full_name="Test User",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None

    # Query back
    result = await db_session.execute(select(User).where(User.username == "test_user"))
    fetched_user = result.scalar_one_or_none()

    assert fetched_user is not None
    assert fetched_user.email == "test@example.com"

@pytest.mark.asyncio
async def test_api_health(client):
    """Verify API health endpoint works"""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
