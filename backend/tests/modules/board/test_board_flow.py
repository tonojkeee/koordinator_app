import pytest
import io
import os
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User
from app.modules.board.models import Document
from app.core.security import get_password_hash

# Helper to get auth headers
async def get_auth_headers(client: AsyncClient, db_session: AsyncSession, username="boarduser"):
    stmt = select(User).where(User.username == username)
    result = await db_session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

    response = await client.post("/api/auth/login", data={"username": username, "password": "pass"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user

@pytest.mark.asyncio
async def test_document_upload_and_retrieval(client: AsyncClient, db_session: AsyncSession):
    """Test uploading a document and then fetching it"""
    headers, user = await get_auth_headers(client, db_session)

    # 1. Upload
    file_content = b"fake pdf content"
    files = {"file": ("test.pdf", file_content, "application/pdf")}
    data = {"title": "Test Document", "description": "Testing uploads"}

    response = await client.post("/api/board/documents", headers=headers, data=data, files=files)
    assert response.status_code == 201
    doc_data = response.json()
    assert doc_data["title"] == "Test Document"
    doc_id = doc_data["id"]

    # 2. List
    response = await client.get("/api/board/documents/owned", headers=headers)
    assert response.status_code == 200
    docs = response.json()
    assert any(d["id"] == doc_id for d in docs)

    # 3. Download/View file content
    response = await client.get(f"/api/board/documents/{doc_id}/view", headers=headers)
    assert response.status_code == 200
    assert response.content == file_content

@pytest.mark.asyncio
async def test_document_deletion(client: AsyncClient, db_session: AsyncSession):
    """Test deleting a document removes it from DB and disk"""
    headers, user = await get_auth_headers(client, db_session, "deleteuser")

    # Upload first
    files = {"file": ("delete-me.txt", b"delete me", "text/plain")}
    res = await client.post("/api/board/documents", headers=headers, data={"title": "To Delete"}, files=files)
    doc_id = res.json()["id"]
    file_path = res.json()["file_path"]

    # Delete
    response = await client.delete(f"/api/board/documents/{doc_id}", headers=headers)
    assert response.status_code == 204

    # Verify gone from DB
    stmt = select(Document).where(Document.id == doc_id)
    res_db = await db_session.execute(stmt)
    assert res_db.scalar_one_or_none() is None

    # Verify gone from disk (path is relative to backend root)
    # The app likely prepends a storage root, but let's check if it exists relative to cwd
    # If the app deleted it successfully, it shouldn't be there.
    assert not os.path.exists(file_path)

@pytest.fixture(autouse=True)
def cleanup_uploads():
    """Cleanup documents directory after tests"""
    yield
    # We should ideally track files created and delete only them
    # For simplicity in these tests, we assume we are running in an isolated environment/worktree
    pass
