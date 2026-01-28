import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    """Test user registration endpoint"""
    # 1. Successful registration
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["full_name"] == "New User"
    assert "id" in data

    # Verify user in database
    result = await db_session.execute(select(User).where(User.username == "newuser"))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.full_name == "New User"

    # 2. Duplicate username registration (should fail)
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "password": "password456",
            "full_name": "Another User",
        },
    )
    assert response.status_code == 400
    # We check status code mainly, as error message might be localized
    assert response.json()["detail"]


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, db_session: AsyncSession):
    """Test user login flow"""
    # Create test user manually
    user = User(
        username="loginuser",
        email="login@example.com",
        hashed_password=get_password_hash("secret123"),
        full_name="Login User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # 1. Successful login
    response = await client.post(
        "/api/auth/login", data={"username": "loginuser", "password": "secret123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Check cookies
    assert "refresh_token" in response.cookies
    assert "csrf_token" in response.cookies

    # 2. Invalid credentials
    response = await client.post(
        "/api/auth/login", data={"username": "loginuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_protected(client: AsyncClient, db_session: AsyncSession):
    """Test protected /me endpoint"""
    # Create user
    user = User(
        username="meuser",
        email="me@example.com",  # Added missing required email field
        hashed_password=get_password_hash("pass"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Login to get token
    login_res = await client.post(
        "/api/auth/login", data={"username": "meuser", "password": "pass"}
    )
    token = login_res.json()["access_token"]

    # 1. Access without token (should fail)
    response = await client.get("/api/auth/me")
    assert response.status_code == 401

    # 2. Access with token
    response = await client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "meuser"
