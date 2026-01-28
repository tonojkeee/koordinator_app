import os
import logging
from typing import Any
from app.core.events import Event, event_bus
from app.modules.auth.events import UserDeleted

logger = logging.getLogger(__name__)


async def handle_user_deleted_cleanup(event: Any):
    """
    Listener for UserDeleted event.
    Cleans up physical files associated with the user.
    """
    if not isinstance(event, UserDeleted):
        return

    logger.info(
        f"Cleaning up files for deleted user {event.username} (ID: {event.user_id})"
    )

    # 1. Delete user avatar
    if event.avatar_url:
        # Assuming avatar_url is like "/uploads/avatars/..."
        avatar_path = event.avatar_url.lstrip("/")
        if os.path.exists(avatar_path):
            try:
                os.remove(avatar_path)
                logger.info(f"Deleted avatar: {avatar_path}")
            except OSError as e:
                logger.error(f"Failed to delete avatar {avatar_path}: {e}")


async def register_auth_handlers(bus: Any = None):
    bus = bus or event_bus
    await bus.subscribe(UserDeleted, handle_user_deleted_cleanup)
