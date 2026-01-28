#!/usr/bin/env python3
"""
Script to create notifications channels for existing users.
Run this after implementing the notifications system.
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

# Add the backend directory to Python path
sys.path.insert(0, backend_dir)

from app.core.database import AsyncSessionLocal
from app.modules.auth.service import UserService
from app.modules.auth.models import User
from sqlalchemy import select


async def create_notifications_channels():
    """Create notifications channels for all existing users"""
    async with AsyncSessionLocal() as db:
        # Get all users
        result = await db.execute(select(User))
        users = result.scalars().all()

        print(f"Found {len(users)} users")

        for user in users:
            print(f"Processing user: {user.username} (ID: {user.id})")
            try:
                notifications_channel = (
                    await UserService.get_or_create_notifications_channel(db, user.id)
                )
                print(
                    f"  ✓ Notifications channel: {notifications_channel.id} - {notifications_channel.display_name}"
                )
            except Exception as e:
                print(f"  ✗ Error: {e}")

        print("Done!")


if __name__ == "__main__":
    asyncio.run(create_notifications_channels())
