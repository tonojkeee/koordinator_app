import logging
from app.core.events import EventBus
from app.modules.auth.events import UserCreated
from app.core.database import AsyncSessionLocal
from app.modules.email.models import EmailAccount

logger = logging.getLogger(__name__)

async def handle_user_created(event: UserCreated) -> None:
    """
    Handle UserCreated event.
    Creates an internal email account for the new user.
    """
    logger.info(f"Creating email account for user {event.username} (ID: {event.user_id})")

    async with AsyncSessionLocal() as db:
        try:
            # Check if exists (idempotency)
            from sqlalchemy import select
            stmt = select(EmailAccount).where(EmailAccount.user_id == event.user_id)
            result = await db.execute(stmt)
            if result.scalar_one_or_none():
                logger.info(f"Email account already exists for user {event.user_id}")
                return

            email_account = EmailAccount(
                user_id=event.user_id,
                email_address=event.email
            )
            db.add(email_account)
            await db.commit()
            logger.info(f"Successfully created email account {event.email} for user {event.user_id}")
        except Exception as e:
            logger.error(f"Failed to create email account for user {event.username}: {e}")

async def register_email_handlers(event_bus: EventBus) -> None:
    """
    Register email module event handlers.
    """
    await event_bus.subscribe(UserCreated, handle_user_created)
