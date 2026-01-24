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
    Also creates a notification message in the user's "Уведомления" channel with action buttons.
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
            
            if invitee_user:
                # Create or get notifications channel for user
                notifications_channel = await UserService.get_or_create_notifications_channel(db, invitee_user.id)
                
                # Create notification message with action buttons
                notification_text = f"📩 Приглашение в канал '{event.channel_name}' от {event.inviter_name}"
                if event.message:
                    notification_text += f"\n💬 Сообщение: {event.message}"
                
                # Add action buttons data to message content
                notification_text += f"\n\n[INVITATION_ACTIONS:{event.invitation_id}]"
                
                msg_data = MessageCreate(
                    channel_id=notifications_channel.id,
                    content=notification_text
                )
                
                # Create system message (user_id=None for system messages)
                notification_msg = await ChatService.create_message(
                    db, msg_data, user_id=None, invitation_id=event.invitation_id
                )
                
                # Send WebSocket notifications
                try:
                    # Send invitation notification to user
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
                    
                    # Send new message notification
                    message_notification = {
                        "type": "new_message",
                        "id": notification_msg.id,
                        "channel_id": notification_msg.channel_id,
                        "user_id": None,
                        "username": "Система",
                        "full_name": "Система",
                        "avatar_url": None,
                        "content": notification_msg.content,
                        "created_at": notification_msg.created_at.isoformat(),
                        "invitation_id": event.invitation_id,
                        "message": {
                            "id": notification_msg.id,
                            "sender_name": "Система",
                            "sender_id": None,
                            "content": notification_msg.content,
                            "created_at": notification_msg.created_at.isoformat(),
                            "invitation_id": event.invitation_id
                        }
                    }
                    await manager.broadcast_to_user(invitee_user.id, message_notification)
                    
                    # Broadcast to notifications channel
                    await manager.broadcast_to_channel(notifications_channel.id, {
                        "id": notification_msg.id,
                        "channel_id": notification_msg.channel_id,
                        "user_id": None,
                        "username": "Система",
                        "full_name": "Система",
                        "avatar_url": None,
                        "content": notification_msg.content,
                        "created_at": notification_msg.created_at.isoformat(),
                        "invitation_id": event.invitation_id,
                        "type": "new_message"
                    })
                    
                    logger.info(f"WebSocket notifications sent for invitation {event.invitation_id}")
                except Exception as ws_error:
                    logger.warning(f"WebSocket notification failed: {ws_error}")
                
                # Prepare and send email notification
                subject = f"Приглашение в канал '{event.channel_name}'"
                
                # Create email body with better formatting and direct link
                email_body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                        .content {{ background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }}
                        .message-box {{ background: #f1f3f4; padding: 15px; border-radius: 6px; margin: 15px 0; }}
                        .actions {{ text-align: center; margin: 20px 0; }}
                        .btn {{ display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }}
                        .btn-accept {{ background: #28a745; color: white; }}
                        .btn-decline {{ background: #dc3545; color: white; }}
                        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🎉 Приглашение в приватный канал</h2>
                        </div>
                        <div class="content">
                            <p><strong>Канал:</strong> {event.channel_name}</p>
                            <p><strong>Пригласил:</strong> {event.inviter_name}</p>
                            <p><strong>Дата приглашения:</strong> {event.created_at}</p>
                """
                
                if event.message:
                    email_body += f"""
                            <div class="message-box">
                                <strong>Сообщение от приглашающего:</strong><br>
                                "{event.message}"
                            </div>
                    """
                
                email_body += f"""
                            <div class="actions">
                                <p>Войдите в систему, чтобы принять или отклонить приглашение:</p>
                                <a href="/invitations" class="btn btn-accept">Перейти к приглашениям</a>
                            </div>
                            <p>Это приглашение отправлено на ваш email: <strong>{event.invitee_email}</strong></p>
                        </div>
                        <div class="footer">
                            <p>Если вы не ожидали это приглашение, просто проигнорируйте это письмо.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                # Send email notification
                try:
                    send_notification_email.delay(invitee_user.id, subject, email_body)
                    logger.info(f"Email notification queued for user {invitee_user.id} about invitation to channel '{event.channel_name}'")
                except Exception as email_error:
                    logger.warning(f"Failed to queue email notification: {email_error}")
            else:
                # For non-existing users, we could implement external email sending
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
