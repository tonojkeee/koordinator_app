import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.auth.models import User
from app.modules.email.models import EmailAccount, EmailMessage, EmailAttachment
from app.modules.email import service as email_service
from app.core.security import get_password_hash
from app.core.config import get_settings
import os
import shutil


# Helper to get auth headers
async def get_auth_headers(
    client: AsyncClient, db_session: AsyncSession, username="testuser"
):
    # Check if user exists
    stmt = select(User).where(User.username == username)
    result = await db_session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash("pass"),
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

    # Login
    response = await client.post(
        "/api/auth/login", data={"username": username, "password": "pass"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user


@pytest.mark.asyncio
async def test_email_processing_and_api(client: AsyncClient, db_session: AsyncSession):
    """Test incoming email parsing and retrieval via API"""
    settings = get_settings()
    username = "emailuser"
    headers, user = await get_auth_headers(client, db_session, username)

    # Internal email address for this user
    domain = settings.internal_email_domain
    recipient_email = f"{username}@{domain}"

    # 1. Simulate incoming email
    raw_email = (
        b"From: sender@external.com\r\n"
        b"To: " + recipient_email.encode() + b"\r\n"
        b"Subject: Test Subject\r\n"
        b"Content-Type: text/html; charset=utf-8\r\n"
        b"\r\n"
        b"<h1>Hello!</h1><p>This is a test email with <script>alert('xss')</script>dangerous tags.</p>"
    )

    await email_service.process_incoming_email(
        db_session,
        sender="sender@external.com",
        recipients=[recipient_email],
        content=raw_email,
    )

    # 2. Verify Account Auto-creation
    result = await db_session.execute(
        select(EmailAccount).where(EmailAccount.user_id == user.id)
    )
    account = result.scalar_one_or_none()
    assert account is not None
    assert account.email_address == recipient_email

    # 3. Verify Message Storage and Sanitization
    result = await db_session.execute(
        select(EmailMessage).where(EmailMessage.account_id == account.id)
    )
    message = result.scalar_one_or_none()
    assert message is not None
    assert message.subject == "Test Subject"
    # Verify <script> was removed by sanitizer
    assert "<script>" not in message.body_html
    assert "<h1>Hello!</h1>" in message.body_html

    # 4. Test API Retrieval
    response = await client.get("/api/email/messages?folder=inbox", headers=headers)
    assert response.status_code == 200
    messages = response.json()
    assert len(messages) >= 1
    assert messages[0]["subject"] == "Test Subject"

    # 5. Test Unread Count
    response = await client.get("/api/email/unread-count", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1

    # 6. Mark as Read
    msg_id = message.id
    response = await client.get(f"/api/email/messages/{msg_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    # Verify unread count decreased
    response = await client.get("/api/email/unread-count", headers=headers)
    assert response.json()["total"] == 0


@pytest.mark.asyncio
async def test_email_flags_and_deletion(client: AsyncClient, db_session: AsyncSession):
    """Test starring and soft-deleting emails"""
    headers, user = await get_auth_headers(client, db_session, "flaguser")

    # Create an account and message manually
    account = EmailAccount(user_id=user.id, email_address="flaguser@example.com")
    db_session.add(account)
    await db_session.flush()

    message = EmailMessage(
        account_id=account.id,
        subject="Flag Test",
        from_address="someone@else.com",
        to_address="flaguser@example.com",
        body_text="Test content",
        is_sent=False,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    # 1. Star message
    response = await client.patch(
        f"/api/email/messages/{message.id}", headers=headers, json={"is_starred": True}
    )
    assert response.status_code == 200
    assert response.json()["is_starred"] is True

    # 2. Soft delete (move to trash)
    response = await client.patch(
        f"/api/email/messages/{message.id}", headers=headers, json={"is_deleted": True}
    )
    assert response.status_code == 200
    assert response.json()["is_deleted"] is True

    # Verify it doesn't show in inbox but shows in trash
    res_inbox = await client.get("/api/email/messages?folder=inbox", headers=headers)
    assert not any(m["id"] == message.id for m in res_inbox.json())

    res_trash = await client.get("/api/email/messages?folder=trash", headers=headers)
    assert any(m["id"] == message.id for m in res_trash.json())


@pytest.fixture(scope="module", autouse=True)
def cleanup_email_uploads():
    """Ensure email uploads directory is cleaned after tests"""
    yield
    if os.path.exists("uploads/email_attachments"):
        # We don't delete the whole directory because other tests might need it,
        # but we could clean up files created during tests if we tracked them.
        # For now, just a placeholder for production-grade cleanup.
        pass
