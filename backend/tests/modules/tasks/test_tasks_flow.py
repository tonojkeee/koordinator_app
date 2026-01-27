import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from app.modules.auth.models import User
from app.modules.tasks.models import Task
from app.core.security import get_password_hash

# Helper to get auth headers
async def get_auth_headers(client: AsyncClient, db_session: AsyncSession, username="testuser", role="user"):
    # Check if user exists
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

    # Login
    response = await client.post("/api/auth/login", data={
        "username": username,
        "password": "pass"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user

@pytest.mark.asyncio
async def test_task_lifecycle_happy_path(client: AsyncClient, db_session: AsyncSession):
    """Test full task lifecycle: Create -> Report -> Confirm"""
    # 1. Setup users
    issuer_headers, issuer = await get_auth_headers(client, db_session, "issuer")
    assignee_headers, assignee = await get_auth_headers(client, db_session, "assignee")

    # 2. Issuer creates task
    deadline = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    response = await client.post("/api/tasks/", headers=issuer_headers, json={
        "title": "Test Task",
        "description": "Integration Test Description",
        "priority": "medium",
        "deadline": deadline,
        "assignee_id": assignee.id
    })
    assert response.status_code == 201
    task_data = response.json()
    # If it returns a list (as indicated in my previous explore result for multi-assignment)
    if isinstance(task_data, list):
        task_id = task_data[0]["id"]
    else:
        task_id = task_data["id"]

    # 3. Assignee sees task in received
    response = await client.get("/api/tasks/received", headers=assignee_headers)
    assert response.status_code == 200
    received_tasks = response.json()
    assert any(t["id"] == task_id for t in received_tasks)

    # 4. Assignee submits report
    response = await client.post(f"/api/tasks/{task_id}/report", headers=assignee_headers, json={
        "report_text": "Task completed successfully"
    })
    assert response.status_code == 200

    # Verify status changed to on_review
    response = await client.get("/api/tasks/issued", headers=issuer_headers)
    issued_tasks = response.json()
    task = next(t for t in issued_tasks if t["id"] == task_id)
    assert task["status"] == "on_review"

    # 5. Issuer confirms task
    response = await client.post(f"/api/tasks/{task_id}/confirm", headers=issuer_headers)
    assert response.status_code == 200

    # Verify status changed to completed
    response = await client.get("/api/tasks/completed", headers=assignee_headers)
    completed_tasks = response.json()
    assert any(t["id"] == task_id and t["status"] == "completed" for t in completed_tasks)

@pytest.mark.asyncio
async def test_task_rejection(client: AsyncClient, db_session: AsyncSession):
    """Test task rejection lifecycle"""
    issuer_headers, issuer = await get_auth_headers(client, db_session, "issuer2")
    assignee_headers, assignee = await get_auth_headers(client, db_session, "assignee2")

    # Create task
    res = await client.post("/api/tasks/", headers=issuer_headers, json={
        "title": "Rejectable Task",
        "description": "Will be rejected",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        "assignee_id": assignee.id
    })
    task_id = res.json()[0]["id"] if isinstance(res.json(), list) else res.json()["id"]

    # Report
    await client.post(f"/api/tasks/{task_id}/report", headers=assignee_headers, json={"report_text": "Done?"})

    # Reject
    response = await client.post(f"/api/tasks/{task_id}/reject", headers=issuer_headers, json={
        "reason": "Not good enough"
    })
    assert response.status_code == 200

    # Verify status reverted to in_progress
    res = await client.get("/api/tasks/received", headers=assignee_headers)
    assert any(t["id"] == task_id and t["status"] == "in_progress" for t in res.json())

@pytest.mark.asyncio
async def test_task_overdue_logic(client: AsyncClient, db_session: AsyncSession):
    """Test automatic overdue status update"""
    issuer_headers, issuer = await get_auth_headers(client, db_session, "issuer3")
    assignee_headers, assignee = await get_auth_headers(client, db_session, "assignee3")

    # Create task with past deadline
    past_deadline = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    await client.post("/api/tasks/", headers=issuer_headers, json={
        "title": "Late Task",
        "description": "Already late",
        "deadline": past_deadline,
        "assignee_id": assignee.id
    })

    # Fetching received tasks should trigger overdue check
    response = await client.get("/api/tasks/received", headers=assignee_headers)
    assert response.status_code == 200
    tasks = response.json()
    assert any(t["title"] == "Late Task" and t["status"] == "overdue" for t in tasks)
