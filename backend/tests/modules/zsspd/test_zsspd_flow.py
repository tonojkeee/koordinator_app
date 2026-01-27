import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User
from app.modules.zsspd.models import ZsspdPackage, ZsspdStatus, ZsspdDirection
from app.core.security import get_password_hash

# Helper to get auth headers
async def get_auth_headers(client: AsyncClient, db_session: AsyncSession, username="zsspduser", role="user"):
    stmt = select(User).where(User.username == username)
    result = await db_session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash("pass"),
            role=role,
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

    response = await client.post("/api/auth/login", data={"username": username, "password": "pass"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user

@pytest.mark.asyncio
async def test_outgoing_package_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """Test full outgoing package lifecycle and role restrictions"""
    user_headers, user = await get_auth_headers(client, db_session, "user_sender", "user")
    admin_headers, admin = await get_auth_headers(client, db_session, "admin_operator", "admin")

    # 1. Create DRAFT package
    response = await client.post("/api/zsspd/outgoing", headers=user_headers, json={
        "subject": "Test Outgoing Package",
        "external_recipient": "Central Archive",
        "outgoing_number": "123-ABC",
        "direction": "OUTGOING"
    })
    assert response.status_code == 201
    package_data = response.json()
    assert package_data["status"] == ZsspdStatus.DRAFT
    package_id = package_data["id"]

    # 2. User updates to READY
    response = await client.put(f"/api/zsspd/packages/{package_id}", headers=user_headers, json={
        "status": ZsspdStatus.READY
    })
    assert response.status_code == 200
    assert response.json()["status"] == ZsspdStatus.READY

    # 3. User attempts to mark as EXPORTED (should fail - only operator/admin)
    response = await client.put(f"/api/zsspd/packages/{package_id}", headers=user_headers, json={
        "status": ZsspdStatus.EXPORTED
    })
    assert response.status_code == 403

    # 4. Admin (operator) marks as EXPORTED
    response = await client.put(f"/api/zsspd/packages/{package_id}", headers=admin_headers, json={
        "status": ZsspdStatus.EXPORTED
    })
    assert response.status_code == 200
    assert response.json()["status"] == ZsspdStatus.EXPORTED

    # 5. Admin marks as SENT
    response = await client.put(f"/api/zsspd/packages/{package_id}", headers=admin_headers, json={
        "status": ZsspdStatus.SENT
    })
    assert response.status_code == 200
    assert response.json()["status"] == ZsspdStatus.SENT

@pytest.mark.asyncio
async def test_zsspd_file_upload(client: AsyncClient, db_session: AsyncSession):
    """Test file upload to a package"""
    headers, user = await get_auth_headers(client, db_session, "fileuser")

    # Create package
    res = await client.post("/api/zsspd/outgoing", headers=headers, json={
        "subject": "File Test",
        "direction": "OUTGOING"
    })
    package_id = res.json()["id"]

    # Upload file
    files = {"file": ("document.pdf", b"pdf content", "application/pdf")}
    response = await client.post(f"/api/zsspd/packages/{package_id}/files", headers=headers, files=files)

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "document.pdf"
    assert "id" in data

    # Verify retrieval
    response = await client.get(f"/api/zsspd/packages/{package_id}", headers=headers)
    assert len(response.json()["files"]) == 1
    assert response.json()["files"][0]["filename"] == "document.pdf"

@pytest.mark.asyncio
async def test_zsspd_access_control(client: AsyncClient, db_session: AsyncSession):
    """Test that users cannot access packages from other users unless admin"""
    headers1, user1 = await get_auth_headers(client, db_session, "user1")
    headers2, user2 = await get_auth_headers(client, db_session, "user2")

    # User 1 creates a package
    res = await client.post("/api/zsspd/outgoing", headers=headers1, json={
        "subject": "User 1 Secret",
        "direction": "OUTGOING"
    })
    package_id = res.json()["id"]

    # User 2 attempts to get details
    response = await client.get(f"/api/zsspd/packages/{package_id}", headers=headers2)
    assert response.status_code == 403
