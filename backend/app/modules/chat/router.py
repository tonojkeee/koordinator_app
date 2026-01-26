from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
import io
import logging
import os
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, defer
from typing import List, Optional

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import decode_access_token
from app.core.file_security import safe_file_operation
from app.core.rate_limit import rate_limit_chat_message
from app.modules.auth.router import get_current_user
from app.modules.auth.models import User
from app.modules.auth.service import UserService
from app.modules.chat.schemas import (
    ChannelCreate, 
    ChannelResponse, 
    MessageCreate, 
    MessageUpdate,
    MessageResponse,
    MessageWithUser,
    UserBasicInfo,
    MessageParentInfo
)
from app.modules.chat.service import ChatService
from app.modules.chat.invitation_service import InvitationService
from app.modules.chat.invitations import (
    ChannelInvitationCreate,
    ChannelInvitationResponse,
    ChannelInvitationList,
    InvitationAccept,
    InvitationDecline,
    PendingInvitations,
    ChannelWithInvitations
)
from app.core.config_service import ConfigService
from app.modules.admin.service import SystemSettingService
from app.modules.chat.models import ChannelMember, Channel, Message, MessageReaction
from app.modules.chat.websocket import manager
from app.modules.chat.validators import sanitize_message_content, validate_emoji, parse_mentions
from app.modules.chat.enrichers import enrich_channel, bulk_enrich_channels

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/channels/{channel_id}/read")
async def mark_channel_as_read(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all messages in a channel as read for current user"""
    last_id = await ChatService.mark_channel_as_read(db, channel_id, current_user.id)
    
    # Broadcast read receipt to the channel
    await manager.broadcast_to_channel(channel_id, {
        "type": "read_receipt",
        "channel_id": channel_id,
        "user_id": current_user.id,
        "last_read_id": last_id
    })

    return {"status": "success", "last_read_message_id": last_id}


@router.post("/channels", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    channel_data: ChannelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new channel"""
    # Check permissions
    if current_user.role != "admin":
        allow_create = await ConfigService.get_value(db, "chat_allow_create_channel")
        if str(allow_create).lower() != "true":
             raise HTTPException(status_code=403, detail="Создание каналов запрещено администратором")

    channel = await ChatService.create_channel(db, channel_data, current_user.id)
    
    # Enrich channel response
    enriched_channel = await enrich_channel(db, channel, current_user.id)
    
    # For public channels, broadcast to ALL connected users
    # For DMs, only notify the creator (DMs are handled separately in /direct endpoint)
    if not channel.is_direct:
        await manager.broadcast_to_all_users({
            "type": "channel_created",
            "channel": {
                "id": enriched_channel.id,
                "name": enriched_channel.name,
                "display_name": enriched_channel.display_name,
                "is_direct": enriched_channel.is_direct,
                "members_count": enriched_channel.members_count,
                "online_count": enriched_channel.online_count,
                "other_user": None,
                "created_at": enriched_channel.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                "is_member": True # Creator is always member
            }
        })
    
    return enriched_channel


@router.post("/channels/{channel_id}/join", response_model=ChannelResponse)
async def join_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Join a public channel"""
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Канал не найден")
        
    if channel.is_direct:
        raise HTTPException(status_code=403, detail="Нельзя присоединиться к приватному чату")
        
    await ChatService.add_member(db, channel_id, current_user.id)
    
    updated_channel = await ChatService.get_channel_by_id(db, channel_id)

    if updated_channel is None:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    await manager.broadcast_to_channel(channel_id, {
        "type": "member_joined",
        "channel_id": channel_id,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "avatar_url": current_user.avatar_url,
            "rank": current_user.rank,
            "is_online": True
        },
        "channel_owner_id": updated_channel.created_by
    })
    
    return await enrich_channel(db, channel, current_user.id)


@router.post("/channels/{channel_id}/transfer-owner")
async def transfer_channel_owner(
    channel_id: int,
    new_owner_id: int = Query(..., description="ID нового владельца канала"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Transfer channel ownership to another member"""
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Канал не найден")

    # Check if current user is the owner
    if channel.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Только владелец может передать права")

    # Check if new owner is a member of the channel
    is_new_owner_member = await ChatService.is_user_member(db, channel_id, new_owner_id)
    if not is_new_owner_member:
        raise HTTPException(status_code=400, detail="Новый владелец должен быть участником канала")

    # Transfer ownership
    await ChatService.transfer_channel_ownership(db, channel_id, new_owner_id)

    # Get new owner info for broadcasting
    new_owner = await UserService.get_user_by_id(db, new_owner_id)

    # Get updated channel info to include owner info
    updated_channel = await ChatService.get_channel_by_id(db, channel_id)

    # Broadcast ownership transfer event
    await manager.broadcast_to_channel(channel_id, {
        "type": "owner_transferred",
        "channel_id": channel_id,
        "old_owner_id": current_user.id,
        "new_owner_id": new_owner_id,
        "new_owner_username": new_owner.username,
        "channel_owner_id": new_owner_id,
        "old_owner_username": current_user.username
    })
    return {"status": "success", "new_owner_id": new_owner_id}


@router.post("/channels/{channel_id}/leave")
async def leave_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Leave a channel"""
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Канал не найден")

    if channel.is_direct:
        raise HTTPException(status_code=403, detail="Нельзя покинуть личный чат (удалите его)")

    # Check if creator tries to leave
    if channel.created_by == current_user.id:
        # Get channel members to see if we can transfer ownership
        member_ids = await ChatService.get_channel_member_ids(db, channel_id)

        # Exclude current user from potential new owners
        other_members = [member_id for member_id in member_ids if member_id != current_user.id]

        if len(other_members) == 0:
            # No other members, allow creator to delete the channel instead
            raise HTTPException(
                status_code=400,
                detail="Вы являетесь создателем канала и единственным участником. Пожалуйста, удалите канал."
            )
        else:
            # There are other members, suggest transferring ownership
            raise HTTPException(
                status_code=400,
                detail="Вы являетесь создателем канала. Передайте права другому участнику перед выходом."
            )

    success = await ChatService.remove_member(db, channel_id, current_user.id)
    if not success:
         raise HTTPException(status_code=400, detail="Вы не являетесь участником этого канала")

    # Get updated channel info to include owner info
    updated_channel = await ChatService.get_channel_by_id(db, channel_id)

    # Broadcast member_left event
    await manager.broadcast_to_channel(channel_id, {
        "type": "member_left",
        "channel_id": channel_id,
        "user_id": current_user.id,
        "channel_owner_id": updated_channel.created_by
    })

    return {"status": "success"}


@router.get("/channels", response_model=List[ChannelResponse])
async def get_my_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all channels for current user"""
    channels = await ChatService.get_user_channels(db, current_user.id)
    return await bulk_enrich_channels(db, channels, current_user.id)


@router.get("/channels/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific channel"""
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Канал не найден"
        )
    
    # Check if user is a member
    is_member = await ChatService.is_user_member(db, channel_id, current_user.id)
    
    if not is_member and channel.is_direct:
        # DM channel - no access allowed
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не являетесь участником этого канала"
        )
    
    return await enrich_channel(db, channel, current_user.id)


@router.get("/channels/{channel_id}/messages", response_model=List[MessageWithUser])
async def get_channel_messages(
    channel_id: int,
    limit: Optional[int] = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine limit
    if limit is None:
        setting_val = await ConfigService.get_value(db, "chat_page_size")
        try:
            limit = int(setting_val)
        except (ValueError, TypeError):
            limit = 50
            
    # Check if user is a member
    is_member = await ChatService.is_user_member(db, channel_id, current_user.id)
    if not is_member:
        channel = await ChatService.get_channel_by_id(db, channel_id)
        if not channel:
            raise HTTPException(status_code=404, detail="Чат не найден")
        
        if channel.is_direct:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Вы не являетесь участником этого канала"
            )
            
    # Allow fetching messages for public channels even if not member (preview mode)
    messages = await ChatService.get_channel_messages(db, channel_id, limit, offset)

    # Batch load users and documents to avoid N+1 queries
    user_ids = {msg.user_id for msg in messages if msg.user_id}
    document_ids = {msg.document_id for msg in messages if msg.document_id}

    # Load all users at once
    users_dict = {}
    if user_ids:
        users_result = await db.execute(
            select(User).where(User.id.in_(user_ids)).options(defer(User.hashed_password))
        )
        users_dict = {user.id: user for user in users_result.scalars().all()}

    # Load all documents at once
    documents_dict = {}
    if document_ids:
        from app.modules.board.models import Document
        docs_result = await db.execute(
            select(Document).where(Document.id.in_(document_ids))
        )
        documents_dict = {doc.id: doc for doc in docs_result.scalars().all()}

    # Enrich messages with user info and document info
    result = []
    for msg in messages:
        user = users_dict.get(msg.user_id)

        doc_info = {"is_document_deleted": False}
        if msg.document_id:
            doc = documents_dict.get(msg.document_id)
            if doc:
                doc_info["document_title"] = doc.title
                doc_info["file_path"] = doc.file_path
            else:
                doc_info["is_document_deleted"] = True

        from app.modules.chat.schemas import ReactionResponse

        result.append(MessageWithUser(
            id=msg.id,
            channel_id=msg.channel_id,
            user_id=msg.user_id,
            document_id=msg.document_id,
            content=msg.content,
            created_at=msg.created_at,
            username=user.username if user else None,  # None for system messages
            full_name=user.full_name if user else None,
            rank=user.rank if user else None,
            role=user.role if user else None,
            avatar_url=user.avatar_url if user else None,
            invitation_id=msg.invitation_id,  # Add invitation_id for system messages
            reactions=[
                ReactionResponse(
                    emoji=r.emoji,
                    user_id=r.user_id,
                    username=r.user.username if r.user else "Unknown"
                ) for r in msg.reactions
            ],
            **doc_info,
            reply_count=getattr(msg, "reply_count", 0),
            parent=msg.parent_info if hasattr(msg, "parent_info") and msg.parent_info else None
        ))

    return result


@router.get("/messages/{message_id}/replies", response_model=List[MessageWithUser])
async def get_message_replies(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get replies for a specific message thread"""
    # Check if user has access to the channel of the parent message
    parent_message = await db.get(Message, message_id)
    if not parent_message:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
        
    is_member = await ChatService.is_user_member(db, parent_message.channel_id, current_user.id)
    if not is_member:
         raise HTTPException(status_code=403, detail="Нет доступа к этому чату")

    messages = await ChatService.get_replies(db, message_id)

    # Batch load users and documents to avoid N+1 queries
    user_ids = {msg.user_id for msg in messages if msg.user_id}
    document_ids = {msg.document_id for msg in messages if msg.document_id}
    
    # Load all users at once
    users_dict = {}
    if user_ids:
        users_result = await db.execute(
            select(User).where(User.id.in_(user_ids)).options(defer(User.hashed_password))
        )
        users_dict = {user.id: user for user in users_result.scalars().all()}
    
    # Load all documents at once
    documents_dict = {}
    if document_ids:
        from app.modules.board.models import Document
        docs_result = await db.execute(
            select(Document).where(Document.id.in_(document_ids))
        )
        documents_dict = {doc.id: doc for doc in docs_result.scalars().all()}

    # Enrich messages
    result = []
    for msg in messages:
        user = users_dict.get(msg.user_id)
        
        doc_info = {"is_document_deleted": False}
        if msg.document_id:
            doc = documents_dict.get(msg.document_id)
            if doc:
                doc_info["document_title"] = doc.title
                doc_info["file_path"] = doc.file_path
            else:
                doc_info["is_document_deleted"] = True
        
        from app.modules.chat.schemas import ReactionResponse
        
        result.append(MessageWithUser(
            id=msg.id,
            channel_id=msg.channel_id,
            user_id=msg.user_id,
            document_id=msg.document_id,
            parent_id=msg.parent_id,
            content=msg.content,
            created_at=msg.created_at,
            username=user.username if user else "Unknown",
            full_name=user.full_name if user else None,
            rank=user.rank if user else None,
            role=user.role if user else None,
            avatar_url=user.avatar_url if user else None,
            invitation_id=msg.invitation_id,  # Add invitation_id for system messages
            reactions=[
                ReactionResponse(
                    emoji=r.emoji,
                    user_id=r.user_id,
                    username=r.user.username if r.user else "Unknown"
                ) for r in msg.reactions
            ],
            **doc_info,
            reply_count=0  # Replies don't have nested replies in this simple implementation
        ))
    
    return result


@router.post("/channels/{channel_id}/pin")
async def toggle_pin_channel(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle channel pinning for current user"""
    is_pinned = await ChatService.toggle_pin_channel(db, channel_id, current_user.id)
    return {"status": "success", "is_pinned": is_pinned}


@router.post("/channels/{channel_id}/mute")
async def mute_channel(
    channel_id: int,
    mute_until: Optional[str] = Query(None, description="ISO format datetime string, or null to unmute"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mute notifications for a channel until a specific time"""
    from datetime import datetime, timezone
    
    mute_dt = None
    if mute_until:
        try:
            mute_dt = datetime.fromisoformat(mute_until.replace('Z', '+00:00'))
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid datetime format")
             
    success = await ChatService.set_mute_status(db, channel_id, current_user.id, mute_dt)
    if not success:
         # Auto-join if public? Logic implies user must be member.
         # For now, just error if not member.
         raise HTTPException(status_code=404, detail="Channel not found or you are not a member")
         
    return {"status": "success", "mute_until": mute_until}


@router.post("/messages/{message_id}/reactions")
async def add_reaction(
    message_id: int,
    emoji: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a reaction to a message"""
    # Validate emoji format
    if not validate_emoji(emoji):
        raise HTTPException(status_code=400, detail="Недопустимый формат эмодзи")
    
    # Get message to find channel_id
    from app.modules.chat.models import Message
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
        
    # Check if user has access to this channel
    is_member = await ChatService.is_user_member(db, message.channel_id, current_user.id)
    if not is_member:
        raise HTTPException(status_code=403, detail="Нет доступа")
        
    reaction = await ChatService.add_reaction(db, message_id, current_user.id, emoji)
    
    # Broadcast to channel
    await manager.broadcast_to_channel(message.channel_id, {
        "type": "reaction_added",
        "message_id": message_id,
        "reaction": {
            "emoji": reaction.emoji,
            "user_id": reaction.user_id,
            "username": current_user.username,
            "avatar_url": current_user.avatar_url
        }
    })
    
    return {"status": "success"}


@router.delete("/messages/{message_id}/reactions")
async def remove_reaction(
    message_id: int,
    emoji: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a reaction from a message"""
    from app.modules.chat.models import Message
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
        
    success = await ChatService.remove_reaction(db, message_id, current_user.id, emoji)
    
    if success:
        # Broadcast to channel
        await manager.broadcast_to_channel(message.channel_id, {
            "type": "reaction_removed",
            "message_id": message_id,
            "emoji": emoji,
            "user_id": current_user.id
        })
        
    return {"status": "success"}
    
    
@router.get("/channels/{channel_id}/members", response_model=List[UserBasicInfo])
async def get_channel_members(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all members of a channel"""
    # Check if user is a member
    is_member = await ChatService.is_user_member(db, channel_id, current_user.id)
    if not is_member:
        channel = await ChatService.get_channel_by_id(db, channel_id)
        if not channel or (channel.is_direct):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет доступа к списку участников этого чата"
            )
        # For public channels, we allow viewing members if not joined? 
        # Actually, let's just require membership for now to keep it simple.
    
    member_ids = await ChatService.get_channel_member_ids(db, channel_id)
    
    stmt = select(User).where(User.id.in_(member_ids))
    result = await db.execute(stmt)
    users = result.scalars().all()

    online_user_ids = await manager.get_online_user_ids()
    result = []
    for u in users:
        user_info = UserBasicInfo.from_orm(u)
        user_info.is_online = u.id in online_user_ids
        result.append(user_info)
        
    return result


@router.websocket("/ws/user")
async def user_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """WebSocket endpoint for global user notifications (new channels, etc.)"""
    import asyncio
    
    # STEP 1: Authenticate BEFORE accepting connection
    try:
        payload = decode_access_token(token)
        if not payload:
            logger.warning("Invalid token, rejecting connection")
            return
        
        user_id_str = payload.get("sub")
        if not user_id_str:
            logger.warning("No user_id in token, rejecting connection")
            return
        
        user_id = int(user_id_str)

        # Check if user is active and connection limit
        async with AsyncSessionLocal() as db:
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user or not user.is_active:
                logger.warning(f"User {user_id} is inactive or not found, rejecting connection")
                return
            
            # Check connection limit BEFORE accepting
            existing_connections = len(manager.user_connections.get(user_id, []))
            if existing_connections >= 5:
                logger.warning(f"User {user_id} has too many connections ({existing_connections}), rejecting")
                return
    except Exception as e:
        logger.error(f"Pre-authentication error: {e}")
        return
    
    # STEP 2 & 3: Connect and handle online status
    try:
        await manager.connect_user(websocket, user_id)
        logger.info(f"WebSocket connection established for user {user_id}")
        
        # Update last_seen in DB immediately
        try:
            async with AsyncSessionLocal() as db_session:
                from sqlalchemy import update
                from datetime import datetime, timezone
                await db_session.execute(
                    update(User).where(User.id == user_id).values(last_seen=datetime.now(timezone.utc))
                )
                await db_session.commit()
        except Exception as e:
            logger.error(f"Error updating last_seen for user {user_id}: {e}")
                
    except Exception as e:
        logger.error(f"Critical error in WebSocket setup for user {user_id}: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except (RuntimeError, WebSocketDisconnect) as close_error:
            logger.debug(f"WebSocket already closed or disconnected: {close_error}")
            pass
        return
    
    try:
        # Keep the connection alive
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=45.0)
            except asyncio.TimeoutError:
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break
            except WebSocketDisconnect:
                break
    except Exception as e:
        logger.error(f"User {user_id} WebSocket error: {e}")
    finally:
        await manager.disconnect_user(websocket, user_id)
        # Final last_seen update on disconnect
        try:
            async with AsyncSessionLocal() as db:
                from datetime import datetime, timezone
                from sqlalchemy import update
                await db.execute(
                    update(User).where(User.id == user_id).values(last_seen=datetime.now(timezone.utc))
                )
                await db.commit()
        except (SQLAlchemyError, Exception) as db_err:
            logger.error(f"Error updating last_seen on disconnect: {db_err}")
        logger.info(f"Cleaned up connection for user {user_id}")


@router.websocket("/ws/{channel_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel_id: int,
    token: str = Query(...),
):
    """WebSocket endpoint for real-time messaging"""
    # Authenticate user
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Convert to int (JWT stores sub as string)
    user_id = int(user_id_str)
    
    # Get DB session
    async with AsyncSessionLocal() as db:
        # Check if user is a member
        is_member = await ChatService.is_user_member(db, channel_id, user_id)
        channel = await ChatService.get_channel_by_id(db, channel_id)
        if not channel:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        if not is_member:
            if channel.is_direct or channel.visibility == 'private':
                # Private channels and DMs require membership
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            
            # Public channels: allow connection without joining (READ-ONLY preview mode)
            # Membership will be checked for each message attempt
        
        # Get user info
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Account disabled")
            return
    
    # Connect with membership information
    await manager.connect(websocket, channel_id, user_id, is_member)
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            
            # Handle typing indicator
            if data.get("type") == "typing":
                await manager.broadcast_to_channel(channel_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "is_typing": data.get("is_typing", True)
                }, exclude_websocket=websocket)
                continue
                
            # FIRST: Check if user is authorized to post messages
            # Re-check membership for each message to handle dynamic joins
            async with AsyncSessionLocal() as db:
                is_current_member = await ChatService.is_user_member(db, channel_id, user_id)
                channel = await ChatService.get_channel_by_id(db, channel_id)
                
                # Determine if user can post messages
                if not is_current_member:
                    if channel and not channel.is_direct and channel.visibility == 'public':
                        # Public channel - user can view but not post without membership
                        await websocket.send_json({
                            "type": "error",
                            "message": "Для отправки сообщений необходимо присоединиться к каналу. Нажмите кнопку 'Присоединиться' в верхней части чата.",
                            "action_required": "join_channel",
                            "channel_id": channel_id
                        })
                        continue
                    else:
                        # Private channel or DM - user should not be here
                        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="No longer a member")
                        return
            
            content = data.get("content", "").strip()
            document_id = data.get("document_id")
            parent_id = data.get("parent_id")
            
            # Sanitize content
            if content:
                content = sanitize_message_content(content)
            
            if not content and not document_id:
                continue
            
            # Check message length
            async with AsyncSessionLocal() as db:
                max_len_setting = await ConfigService.get_value(db, "chat_max_message_length")
                try:
                    max_len = int(max_len_setting)
                except (ValueError, TypeError):
                    max_len = 4000
                    
                if len(content) > max_len:
                    await websocket.send_json({
                        "type": "error", 
                        "message": f"Сообщение слишком длинное. Максимум {max_len} символов."
                    })
                    continue

                # Rate limiting check
                if not await rate_limit_chat_message(user_id, db):
                    await websocket.send_json({
                        "type": "error", 
                        "message": "Слишком много сообщений. Пожалуйста, подождите."
                    })
                    continue
                
            # Parse mentions
            mentioned_usernames = parse_mentions(content)
            mentioned_user_ids = []
            
            if mentioned_usernames:
                async with AsyncSessionLocal() as db_session:
                    mention_stmt = select(User).where(User.username.in_(mentioned_usernames))
                    mention_result = await db_session.execute(mention_stmt)
                    mentioned_users = mention_result.scalars().all()
                    mentioned_user_ids = [u.id for u in mentioned_users]

            # Save message to database
            async with AsyncSessionLocal() as db:
                message_data = MessageCreate(
                    channel_id=channel_id, 
                    content=content, 
                    document_id=document_id,
                    parent_id=parent_id
                )
                message = await ChatService.create_message(db, message_data, user_id, document_id=document_id)
                
                # Get channel info for notification
                channel = await ChatService.get_channel_by_id(db, channel_id)
                
                # Get document info if exists
                doc_info = {"is_document_deleted": False}
                if document_id:
                    from app.modules.board.models import Document
                    doc_result = await db.execute(select(Document).where(Document.id == document_id))
                    doc = doc_result.scalar_one_or_none()
                    if doc:
                        doc_info["document_title"] = doc.title
                        doc_info["file_path"] = doc.file_path
                    else:
                        doc_info["is_document_deleted"] = True

                # Get parent info if exists
                parent_info = None
                if message.parent_id:
                    parent_msg_stmt = select(Message).options(selectinload(Message.user)).where(Message.id == message.parent_id)
                    parent_result = await db.execute(parent_msg_stmt)
                    parent_msg = parent_result.scalars().first()
                    if parent_msg:
                        parent_info = {
                            "id": parent_msg.id,
                            "content": parent_msg.content,
                            "username": parent_msg.user.username if parent_msg.user else "Unknown",
                            "full_name": parent_msg.user.full_name if parent_msg.user else None
                        }

                # Broadcast to all connected clients in the channel WebSocket
                
                # Use data from refreshed message.user
                msg_user = message.user
                
                await manager.broadcast_to_channel(channel_id, {
                    "type": "new_message",
                    "id": message.id,
                    "channel_id": message.channel_id,
                    "user_id": message.user_id,
                    "username": msg_user.username if msg_user else "Unknown",
                    "full_name": msg_user.full_name if msg_user else None,
                    "rank": msg_user.rank if msg_user else None,
                    "role": msg_user.role if msg_user else "user",
                    "avatar_url": msg_user.avatar_url if msg_user else None,
                    "content": message.content,
                    "document_id": message.document_id,
                    "parent_id": message.parent_id,
                    "parent": parent_info,
                    "invitation_id": message.invitation_id,  # Add invitation_id for system messages
                    **doc_info,
                    "created_at": message.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    "mentions": mentioned_user_ids,
                    "reply_count": 0
                })
                
                # Also broadcast to all channel members via global WebSocket
                # This notifies users who are not currently viewing the channel
                member_ids = await ChatService.get_channel_member_ids(db, channel_id)
                for member_id in member_ids:
                    is_mentioned = member_id in mentioned_user_ids
                    
                    await manager.broadcast_to_user(member_id, {
                        "type": "new_message",
                        "channel_id": channel_id,
                        "channel_name": channel.name if channel else None,
                        "is_direct": channel.is_direct if channel else False,
                        "is_mentioned": is_mentioned,
                        "message": {
                            "id": message.id,
                            "content": message.content[:100],  # Truncate for notification
                            "sender_id": user_id,
                            "sender_name": user.full_name or user.username,
                            "sender_full_name": user.full_name,
                            "sender_rank": user.rank,
                            "created_at": message.created_at.strftime('%Y-%m-%dT%H:%M:%SZ'),
                            "invitation_id": message.invitation_id  # Add invitation_id for system messages
                        }
                    })
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, channel_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, channel_id, user_id)


@router.post("/direct/{user_id}", response_model=ChannelResponse)
async def start_direct_message(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start or get a direct message channel with another user"""
    # logger.debug(f"Starting DM: current_user={current_user.id} -> target_user={user_id}")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя начать чат с самим собой")
    
    # Check if target user exists
    target_user = await UserService.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Check if channel already exists
    existing_channel = await ChatService.get_or_create_direct_channel(db, current_user.id, user_id)
    # logger.debug(f"Channel: id={existing_channel.id}, is_direct={existing_channel.is_direct}")
    
    # Get member IDs
    member_ids = await ChatService.get_channel_member_ids(db, existing_channel.id)
    # logger.debug(f"Member IDs from DB: {member_ids} (types: {[type(m).__name__ for m in member_ids]})")
    
    # Debug: show current WebSocket connections
    # logger.debug(f"Current WebSocket user_connections keys: {list(manager.user_connections.keys())}")
    # logger.debug(f"Connection key types: {[type(k).__name__ for k in manager.user_connections.keys()]}")
    
    # Enrich the channel response for the current user
    channel_response = await enrich_channel(db, existing_channel, current_user.id)
    
    # We do NOT broadcast channel_created to the target user yet.
    # The DM should only appear for them once they receive the first message.
    
    return channel_response


@router.delete("/channels/{channel_id}")
async def delete_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a channel or DM"""
    # Get channel info and members BEFORE deleting
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    member_ids = await ChatService.get_channel_member_ids(db, channel_id)
    channel_name = channel.name
    is_direct = channel.is_direct
    
    # Perform deletion
    success = await ChatService.delete_channel(db, channel_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого чата"
        )
    
    # Notify all members about the deletion
    for member_id in member_ids:
        # Don't notify the user who deleted the channel
        if member_id == current_user.id:
            continue
        
        await manager.broadcast_to_user(member_id, {
            "type": "channel_deleted",
            "channel_id": channel_id,
            "channel_name": channel_name,
            "is_direct": is_direct,
            "deleted_by": {
                "id": current_user.id,
                "username": current_user.username,
                "full_name": current_user.full_name
            }
        })
    
    return {"status": "success"}

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a message. Only the message author or admin can delete."""
    is_admin = current_user.role == "admin"
    
    # Check system setting if not admin
    if not is_admin:
        allow_delete = await ConfigService.get_value(db, "chat_allow_delete")
        if str(allow_delete).lower() != "true":
             raise HTTPException(status_code=403, detail="Удаление сообщений запрещено администратором")

    
    deleted_message = await ChatService.delete_message(db, message_id, current_user.id, is_admin)
    
    if not deleted_message:
        raise HTTPException(status_code=404, detail="Message not found or unauthorized")
    
    # If message had a document, delete the file
    if deleted_message.document_id:
        try:
            from app.modules.board.models import Document
            stmt = select(Document).where(Document.id == deleted_message.document_id)
            result = await db.execute(stmt)
            document = result.scalars().first()
            
            if document:
                # Secure file deletion with path validation
                try:
                    safe_path = safe_file_operation(document.file_path, "uploads/documents")
                    if os.path.exists(safe_path):
                        os.remove(safe_path)
                except ValueError as e:
                    logger.error(f"Path traversal detected in document deletion: {e}")
                except Exception as e:
                    logger.error(f"Error deleting document file: {e}")
                
                await db.delete(document)
                await db.commit()
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
    
    # Broadcast deletion
    await manager.broadcast_to_channel(deleted_message.channel_id, {
        "type": "message_deleted",
        "message_id": message_id,
        "channel_id": deleted_message.channel_id
    })
    
    return None


@router.put("/messages/{message_id}", response_model=MessageWithUser)
async def update_message(
    message_id: int,
    message_data: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a message content"""
    is_admin = current_user.role == "admin"
    
    updated_msg = await ChatService.update_message(
        db, message_id, message_data.content, current_user.id, is_admin
    )
    
    if not updated_msg:
        raise HTTPException(status_code=404, detail="Сообщение не найдено или нет прав")
        
    # Reload full message with relations for response
    stmt = select(Message).options(
        selectinload(Message.user), 
        selectinload(Message.document),
        selectinload(Message.reactions).selectinload(MessageReaction.user)
    ).where(Message.id == message_id)
    result = await db.execute(stmt)
    full_msg = result.scalars().first()
    
    # Construct response
    from app.modules.chat.schemas import ReactionResponse
    
    # Doc info
    doc_info = {"is_document_deleted": False}
    if full_msg.document_id and full_msg.document:
        doc_info["document_title"] = full_msg.document.title
        doc_info["file_path"] = full_msg.document.file_path
    elif full_msg.document_id:
        doc_info["is_document_deleted"] = True
        
    response = MessageWithUser(
        id=full_msg.id,
        channel_id=full_msg.channel_id,
        user_id=full_msg.user_id,
        document_id=full_msg.document_id,
        parent_id=full_msg.parent_id,
        content=full_msg.content,
        created_at=full_msg.created_at,
        updated_at=full_msg.updated_at,
        username=full_msg.user.username if full_msg.user else "Unknown",
        full_name=full_msg.user.full_name if full_msg.user else None,
        rank=full_msg.user.rank if full_msg.user else None,
        role=full_msg.user.role if full_msg.user else None,
        avatar_url=full_msg.user.avatar_url if full_msg.user else None,
        invitation_id=full_msg.invitation_id,  # Add invitation_id for system messages
        reactions=[
            ReactionResponse(
                emoji=r.emoji,
                user_id=r.user_id,
                username=r.user.username if r.user else "Unknown"
            ) for r in getattr(full_msg, "reactions", [])
        ],
        **doc_info
    )
    
    # Broadcast update
    await manager.broadcast_to_channel(full_msg.channel_id, {
        "type": "message_updated",
        "id": full_msg.id,
        "channel_id": full_msg.channel_id,
        "content": full_msg.content,
        "updated_at": full_msg.updated_at.strftime('%Y-%m-%dT%H:%M:%SZ') if full_msg.updated_at else None
    })
    
    return response


@router.get("/search", response_model=List[MessageWithUser])
async def search_messages_endpoint(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search messages visible to the user"""
    messages = await ChatService.search_messages(db, q, current_user.id, limit, offset)
    
    # Enrich results
    from app.modules.chat.schemas import ReactionResponse
    
    result = []
    for msg in messages:
        doc_info = {"is_document_deleted": False}
        if msg.document_id and msg.document:
            doc_info["document_title"] = msg.document.title
            doc_info["file_path"] = msg.document.file_path
        elif msg.document_id:
            doc_info["is_document_deleted"] = True
            
        result.append(MessageWithUser(
            id=msg.id,
            channel_id=msg.channel_id,
            user_id=msg.user_id,
            document_id=msg.document_id,
            parent_id=msg.parent_id,
            content=msg.content,
            created_at=msg.created_at,
            updated_at=msg.updated_at,
            username=msg.user.username if msg.user else "Unknown",
            full_name=msg.user.full_name if msg.user else None,
            rank=msg.user.rank if msg.user else None,
            role=msg.user.role if msg.user else None,
            avatar_url=msg.user.avatar_url if msg.user else None,
            invitation_id=msg.invitation_id,  # Add invitation_id for system messages
            reactions=[], # Search doesn't need reactions usually, keeping light
            **doc_info
        ))
        
    return result


@router.get("/channels/{channel_id}/export")
async def export_chat_history(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export chat history to TXT file"""
    # Check access
    if not await ChatService.is_user_member(db, channel_id, current_user.id):
        raise HTTPException(status_code=403, detail="Нет доступа к этому чату")
    
    # Get channel info for name
    channel = await ChatService.get_channel_by_id(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Канал не найден")
    
    channel_name = channel.display_name or channel.name or f"channel_{channel_id}"
    
    # Get messages (limit to 10000 for safety)
    messages = await ChatService.get_channel_messages(db, channel_id, limit=10000)
    
    # Build text content
    buffer = io.StringIO()
    buffer.write(f"Экспорт истории чата: {channel_name}\n")
    buffer.write(f"Экспортировал: {current_user.full_name or current_user.username} ({current_user.username})\n")
    buffer.write(f"Дата экспорта: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    buffer.write("-" * 50 + "\n\n")
    
    # Messages come newest first from service, so reverse them
    for msg in reversed(messages):
        username = msg.user.username if msg.user else "Система"
        fullname = f" ({msg.user.full_name})" if msg.user and msg.user.full_name else ""
        time = msg.created_at.strftime("[%Y-%m-%d %H:%M:%S]")
        
        buffer.write(f"{time} {username}{fullname}:\n")
        buffer.write(f"{msg.content}\n")
        if msg.document_id:
             buffer.write(f"[Вложение: Документ ID {msg.document_id}]\n")
        buffer.write("\n")
        
    buffer.seek(0)
    
    # Safe filename - URL encode for non-ASCII characters (RFC 5987)
    from urllib.parse import quote
    safe_name = "".join(c if c.isalnum() or c in (' ', '_', '-') else '_' for c in channel_name)
    encoded_filename = quote(f"export_{safe_name}.txt")
    
    return StreamingResponse(
        io.BytesIO(buffer.getvalue().encode('utf-8')),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )


# ===== INVITATION ENDPOINTS =====

@router.post("/invitations", response_model=ChannelInvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    invitation_data: ChannelInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new channel invitation"""
    return await InvitationService.create_invitation(db, invitation_data, current_user.id)


@router.post("/invitations/accept", response_model=ChannelResponse)
async def accept_invitation(
    accept_data: InvitationAccept,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept a channel invitation"""
    channel = await InvitationService.accept_invitation(db, accept_data.invitation_id, current_user.id)
    
    # Enrich channel response
    enriched_channel = await enrich_channel(db, channel, current_user.id)
    
    # Broadcast to channel that user joined
    await manager.broadcast_to_channel(channel.id, {
        "type": "member_joined",
        "channel_id": channel.id,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "avatar_url": current_user.avatar_url,
            "rank": current_user.rank,
            "is_online": True
        },
        "channel_owner_id": channel.created_by
    })
    
    # IMPORTANT: Broadcast invitation status update to all users
    # This ensures the UI immediately updates when invitation is accepted
    await manager.broadcast_to_all_users({
        "type": "invitation_status_changed",
        "invitation_id": accept_data.invitation_id,
        "status": "accepted",
        "user_id": current_user.id,
        "channel_id": channel.id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return enriched_channel


@router.post("/invitations/decline")
async def decline_invitation(
    decline_data: InvitationDecline,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Decline a channel invitation"""
    await InvitationService.decline_invitation(
        db, 
        decline_data.invitation_id, 
        current_user.id, 
        decline_data.reason
    )
    
    # IMPORTANT: Broadcast invitation status update to all users
    # This ensures the UI immediately updates when invitation is declined
    await manager.broadcast_to_all_users({
        "type": "invitation_status_changed",
        "invitation_id": decline_data.invitation_id,
        "status": "declined",
        "user_id": current_user.id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"status": "success"}


@router.get("/invitations/pending", response_model=PendingInvitations)
async def get_pending_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending invitations for current user"""
    return await InvitationService.get_pending_invitations(db, current_user.id)


@router.get("/channels/{channel_id}/invitations", response_model=ChannelInvitationList)
async def get_channel_invitations(
    channel_id: int,
    include_expired: bool = Query(False, description="Include expired invitations"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all invitations for a channel (admin only)"""
    return await InvitationService.get_channel_invitations(
        db, 
        channel_id, 
        current_user.id, 
        include_expired
    )


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pending invitation (admin only)"""
    await InvitationService.cancel_invitation(db, invitation_id, current_user.id)
    return {"status": "success"}


@router.get("/channels/with-invitations", response_model=List[ChannelWithInvitations])
async def get_channels_with_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all channels where user has pending invitations or can invite others"""
    return await InvitationService.get_channels_with_invitations(db, current_user.id)
