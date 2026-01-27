import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User, Unit
from app.core.security import get_password_hash

# Helper to get auth headers
async def get_auth_headers(client: AsyncClient, db_session: AsyncSession, username="archiveuser", unit_name="Test Unit"):
    # Ensure Unit exists
    stmt_unit = select(Unit).where(Unit.name == unit_name)
    res_unit = await db_session.execute(stmt_unit)
    unit = res_unit.scalar_one_or_none()
    if not unit:
        unit = Unit(name=unit_name)
        db_session.add(unit)
        await db_session.commit()
        await db_session.refresh(unit)

    stmt = select(User).where(User.username == username)
    result = await db_session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash("pass"),
            unit_id=unit.id,
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

    response = await client.post("/api/auth/login", data={"username": username, "password": "pass"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user, unit

@pytest.mark.asyncio
async def test_archive_folder_management(client: AsyncClient, db_session: AsyncSession):
    """Test creating and renaming archive folders"""
    headers, user, unit = await get_auth_headers(client, db_session)

    # 1. Create Folder
    response = await client.post("/api/archive/folders", headers=headers, json={
        "name": "Project Alpha",
        "is_private": False
    })
    assert response.status_code == 201
    folder_data = response.json()
    assert folder_data["name"] == "Project Alpha"
    folder_id = folder_data["id"]

    # 2. List Content
    response = await client.get("/api/archive/contents", headers=headers)
    assert response.status_code == 200
    content = response.json()
    assert any(f["id"] == folder_id for f in content["folders"])

    # 3. Rename Folder
    response = await client.patch(f"/api/archive/folders/{folder_id}", headers=headers, json={
        "name": "Project Alpha - Final"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Project Alpha - Final"

@pytest.mark.asyncio
async def test_archive_file_upload_and_permissions(client: AsyncClient, db_session: AsyncSession):
    """Test archive upload and cross-unit access restriction"""
    # 1. User from Unit A uploads a file
    headers_a, user_a, unit_a = await get_auth_headers(client, db_session, "userA", "Unit A")

    files = {"file": ("archive.txt", b"secret unit a content", "text/plain")}
    data = {"title": "Unit A Doc", "is_private": False} # Not private, but still unit-restricted

    response = await client.post("/api/archive/upload", headers=headers_a, data=data, files=files)
    assert response.status_code == 201
    file_id = response.json()["id"]

    # 2. User from Unit B attempts to access it (should fail or not see it)
    headers_b, user_b, unit_b = await get_auth_headers(client, db_session, "userB", "Unit B")

    # Access file content (viewing also checks permissions)
    response = await client.get(f"/api/archive/files/{file_id}/view", headers=headers_b)
    # The logic usually restricts access to members of the same unit
    assert response.status_code == 403

    # 3. Admin can access anything
    headers_admin, admin, _ = await get_auth_headers(client, db_session, "adminuser", "Admin Unit")
    admin.role = "admin"
    await db_session.commit()

    response = await client.get(f"/api/archive/files/{file_id}/view", headers=headers_admin)
    assert response.status_code == 200
