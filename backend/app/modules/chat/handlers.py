"""
Event Handlers for Chat Module

Subscribes to events from other modules and handles them.
"""

from app.core.events import EventBus
from app.core.websocket_manager import websocket_manager as manager
from app.core.i18n import get_text


async def handle_document_shared(event) -> None:
    """
    Handle DocumentSharedEvent from board module.

    Creates a message in the shared channel about the document.
    Broadcasts the message to all channel participants.
    """
    from app.modules.chat.service import ChatService
    from app.modules.chat.schemas import MessageCreate
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        # Create message content
        msg_content = get_text("chat.file_shared", document_title=event.document_title)
        msg_data = MessageCreate(
            channel_id=event.channel_id,
            content=msg_content,
            document_id=event.document_id
        )

        # Create message
        msg = await ChatService.create_message(
            db, msg_data, event.sender_id, document_id=event.document_id
        )

        # Broadcast message to channel
        await manager.broadcast_to_channel(event.channel_id, {
            "id": msg.id,
            "channel_id": msg.channel_id,
            "user_id": msg.user_id,
            "username": event.sender_username,
            "full_name": event.sender_full_name,
            "avatar_url": event.sender_avatar_url,
            "content": msg.content,
            "document_id": event.document_id,
            "document_title": event.document_title,
            "created_at": msg.created_at.isoformat(),
            "type": "message"
        })


async def handle_invitation_created(event) -> None:
    """
    Handle InvitationCreated event.
    
    Sends email notification and WebSocket notification to invitee.
    Also creates a notification message in the user's "Уведомления" channel.
    """
    from app.core.database import AsyncSessionLocal
    from app.modules.auth.service import UserService
    from app.modules.chat.service import ChatService
    from app.modules.chat.schemas import MessageCreate
    from app.core.tasks import send_notification_email
    import logging
    
    logger = logging.getLogger(__name__)
    
    async with AsyncSessionLocal() as db:
        try:
            # Check if invitee is an existing user
            invitee_user = await UserService.get_user_by_email(db, event.invitee_email)
            
            # Prepare email content
            subject = f"Приглашение в канал '{event.channel_name}'"
            
            if event.message:
                body = f"""
                <h2>Вы приглашены в канал "{event.channel_name}"</h2>
                <p><strong>Пригласил:</strong> {event.inviter_name}</p>
                <p><strong>Сообщение:</strong> {event.message}</p>
                <p>Войдите в систему, чтобы принять приглашение.</p>
                """
            else:
                body = f"""
                <h2>Вы приглашены в канал "{event.channel_name}"</h2>
                <p><strong>Пригласил:</strong> {event.inviter_name}</p>
                <p>Войдите в систему, чтобы принять приглашение.</p>
                """
            
            if invitee_user:
                # Create or get notifications channel for user
                from app.modules.auth.service import UserService
                notifications_channel = await UserService.get_or_create_notifications_channel(db, invitee_user.id)
                
                # Create notification message in the channel
                notification_text = f"📩 Приглашение в канал '{event.channel_name}' от {event.inviter_name}"
                if event.message:
                    notification_text += f"\n💬 Сообщение: {event.message}"
                notification_text += f"\n🔗 Перейдите в раздел 'Приглашения' для ответа"
                
                msg_data = MessageCreate(
                    channel_id=notifications_channel.id,
                    content=notification_text
                )
                
                # Create system message (user_id=None for system messages)
                notification_msg = await ChatService.create_message(
                    db, msg_data, user_id=None  # System message
                )
                
                logger.info(f"Created notification message in channel {notifications_channel.id} for user {invitee_user.id}")
                
                # Send WebSocket notification if user is online
                if invitee_user.notify_browser:
                    notification_data = {
                        "type": "invitation_received",
                        "invitation_id": event.invitation_id,
                        "channel_id": event.channel_id,
                        "channel_name": event.channel_name,
                        "inviter_name": event.inviter_name,
                        "message": event.message,
                        "created_at": event.created_at
                    }
                    await manager.broadcast_to_user(invitee_user.id, notification_data)
                    
                    # Also broadcast the new message to the notifications channel
                    await manager.broadcast_to_channel(notifications_channel.id, {
                        "id": notification_msg.id,
                        "channel_id": notification_msg.channel_id,
                        "user_id": None,
                        "username": "Система",
                        "full_name": "Система",
                        "avatar_url": None,
                        "content": notification_msg.content,
                        "created_at": notification_msg.created_at.isoformat(),
                        "type": "message"
                    })
                
                # Try to send email notification (may fail if Celery is not running)
                try:
                    send_notification_email.delay(invitee_user.id, subject, body)
                    logger.info(f"Email notification queued for user {invitee_user.id}")
                except Exception as email_error:
                    logger.warning(f"Failed to queue email notification: {email_error}")
            else:
                # For non-existing users, we would need to implement external email sending
                # For now, just log it
                logger.info(f"Invitation sent to external email: {event.invitee_email}")
                
        except Exception as e:
            logger.error(f"Error handling invitation created event: {e}", exc_info=True)


async def register_event_handlers(event_bus: EventBus) -> None:
    """
    Register all event handlers for chat module.

    Call this in main.py lifespan to activate event handling.
    """
    from app.modules.board.events import DocumentSharedEvent
    from app.modules.chat.events import InvitationCreated

    await event_bus.subscribe(DocumentSharedEvent, handle_document_shared)
    await event_bus.subscribe(InvitationCreated, handle_invitation_created)
