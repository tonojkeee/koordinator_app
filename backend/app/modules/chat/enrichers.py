"""Response enrichers for chat module"""

from sqlalchemy import select, func, and_
from sqlalchemy.orm import defer, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.modules.chat.models import Channel, Message, ChannelMember
from app.modules.chat.schemas import ChannelResponse, LastMessageInfo, UserBasicInfo
from app.modules.chat.service import ChatService
from app.modules.auth.models import User
from app.modules.chat.websocket import manager


async def bulk_enrich_channels(
    db: AsyncSession, channels: list[Channel], current_user_id: int
) -> list[ChannelResponse]:
    """
    Efficiently enrich a list of channels avoiding N+1 queries.
    """
    if not channels:
        return []

    channel_ids = [c.id for c in channels]

    # 1. Bulk fetch member counts
    member_counts = {}
    stmt = (
        select(ChannelMember.channel_id, func.count(ChannelMember.id))
        .where(ChannelMember.channel_id.in_(channel_ids))
        .group_by(ChannelMember.channel_id)
    )
    result = await db.execute(stmt)
    for cid, count in result.all():
        member_counts[cid] = count

    # 2. Bulk fetch unread counts
    # This is tricky because it depends on each user's last_read_id
    # We can try to optimize, but for now let's iterate or assume Service provides info
    # The service now provides current_user_member_info attached to channel

    # 3. Bulk fetch last messages
    # We need the latest message for each channel
    # Strategy: Get max message ID per channel, then fetch those messages with authors
    last_message_map = {}

    stmt_max_ids = (
        select(Message.channel_id, func.max(Message.id))
        .where(Message.channel_id.in_(channel_ids))
        .group_by(Message.channel_id)
    )
    result_max = await db.execute(stmt_max_ids)
    max_msg_ids = [row[1] for row in result_max.all() if row[1] is not None]

    if max_msg_ids:
        # Fetch full message objects with senders
        stmt_msgs = (
            select(Message)
            .options(selectinload(Message.user))  # User is relationship
            .where(Message.id.in_(max_msg_ids))
        )
        result_msgs = await db.execute(stmt_msgs)
        messages = result_msgs.scalars().all()
        for msg in messages:
            last_message_map[msg.channel_id] = msg

    # 4. Bulk fetch DM other users
    dm_channel_ids = [c.id for c in channels if c.is_direct]
    dm_users_map = {}
    if dm_channel_ids:
        stmt_dm = (
            select(ChannelMember.channel_id, User)
            .join(User, ChannelMember.user_id == User.id)
            .where(
                and_(
                    ChannelMember.channel_id.in_(dm_channel_ids),
                    ChannelMember.user_id != current_user_id,
                )
            )
            .options(defer(User.hashed_password))
        )
        result_dm = await db.execute(stmt_dm)
        for cid, user in result_dm.all():
            dm_users_map[cid] = user

    # 5. Build responses
    responses = []
    online_user_ids = set(await manager.get_online_user_ids())

    for channel in channels:
        resp = ChannelResponse.from_orm(channel)
        resp.is_owner = channel.created_by == current_user_id
        resp.members_count = member_counts.get(channel.id, 0)
        resp.online_count = await manager.get_online_count(
            channel.id
        )  # Redis call, fast enough

        # User specific info (from service attachment)
        member_info = getattr(channel, "current_user_member_info", {})
        resp.is_member = member_info.get("is_member", False)
        resp.is_pinned = member_info.get("is_pinned", False)
        resp.mute_until = member_info.get("mute_until")
        resp.last_read_message_id = member_info.get("last_read_message_id")
        resp.user_role = member_info.get("role")

        # Calculate unread count if member
        if resp.is_member:
            last_read = resp.last_read_message_id or 0
            # Ideally we bulk fetch this too, but for now let's query
            # Optimizing:
            # We can run one big query for all unread counts if needed, but let's stick to per-channel for this part
            # or rely on ChatService.get_unread_count logic
            # To fix N+1 fully, we need: select channel_id, count(*) from messages where id > user_last_read group by channel_id
            # But user_last_read varies per channel.
            # We can do it in a loop or complex query. For 10-20 channels, loop is okay-ish if simple count.
            # Let's keep existing Service call for unread count to minimize risk, or implement bulk unread later.
            resp.unread_count = await ChatService.get_unread_count(
                db, channel.id, current_user_id
            )
        else:
            resp.unread_count = 0

        # DM info
        if channel.is_direct:
            other_user = dm_users_map.get(channel.id)
            if other_user:
                resp.display_name = other_user.full_name or other_user.username
                user_info = UserBasicInfo.from_orm(other_user)
                user_info.is_online = other_user.id in online_user_ids
                resp.other_user = user_info
            else:
                resp.display_name = (
                    "Self" if channel.created_by == current_user_id else "Unknown"
                )
        else:
            resp.display_name = channel.name

        # Last message
        last_msg = last_message_map.get(channel.id)
        if last_msg:
            sender = last_msg.user
            resp.last_message = LastMessageInfo(
                id=last_msg.id,
                content=last_msg.content[:100] if last_msg.content else "",
                sender_id=last_msg.user_id,
                sender_name=(
                    sender.full_name or sender.username if sender else "Система"
                ),
                sender_full_name=sender.full_name if sender else None,
                sender_rank=sender.rank if sender else None,
                created_at=last_msg.created_at,
            )
        else:
            resp.last_message = None

        responses.append(resp)

    return responses


async def enrich_channel(
    db: AsyncSession, channel: Channel, current_user_id: int
) -> ChannelResponse:
    """
    Enrich channel response with DM metadata, counts, and last message.
    """
    resp = ChannelResponse.from_orm(channel)

    # Set if current user is the owner
    resp.is_owner = channel.created_by == current_user_id

    # Get member count
    member_count_stmt = select(func.count(ChannelMember.id)).where(
        ChannelMember.channel_id == channel.id
    )
    result = await db.execute(member_count_stmt)
    resp.members_count = result.scalar() or 0

    # Get online count - users actually connected to this channel via WebSocket
    resp.online_count = await manager.get_online_count(channel.id)

    # Get unread count and last_read_message_id for current user
    stmt = select(ChannelMember).where(
        ChannelMember.channel_id == channel.id, ChannelMember.user_id == current_user_id
    )
    result = await db.execute(stmt)
    member = result.scalars().first()

    if member:
        resp.is_member = True
        resp.last_read_message_id = member.last_read_message_id
        resp.unread_count = await ChatService.get_unread_count(
            db, channel.id, current_user_id
        )
        resp.user_role = member.role
    else:
        resp.is_member = False
        resp.unread_count = 0
        resp.user_role = None

    # Get max last_read_message_id from others
    others_read_stmt = select(func.max(ChannelMember.last_read_message_id)).where(
        ChannelMember.channel_id == channel.id, ChannelMember.user_id != current_user_id
    )
    others_read_result = await db.execute(others_read_stmt)
    resp.others_read_id = others_read_result.scalar() or 0

    if channel.is_direct:
        # Find other member for DM channels
        resp = await enrich_direct_channel(db, channel, current_user_id, resp)
    else:
        resp.display_name = channel.name

    # Get last message for channel preview
    resp = await enrich_last_message(db, channel, resp)

    # Set pinning and mute status
    resp = await enrich_channel_settings(db, channel, current_user_id, resp)

    return resp


async def enrich_direct_channel(
    db: AsyncSession, channel: Channel, current_user_id: int, resp: ChannelResponse
) -> ChannelResponse:
    """Enrich direct message channel with other user info"""
    stmt = (
        select(User)
        .options(defer(User.hashed_password))
        .join(ChannelMember)
        .where(ChannelMember.channel_id == channel.id)
        .where(User.id != current_user_id)
    )
    result = await db.execute(stmt)
    other_user: Optional[User] = result.scalar_one_or_none()

    if other_user:
        resp.display_name = other_user.full_name or other_user.username
        user_info = UserBasicInfo.from_orm(other_user)
        user_info.is_online = other_user.id in await manager.get_online_user_ids()
        resp.other_user = user_info
    else:
        resp.display_name = (
            "Self" if channel.created_by == current_user_id else "Unknown"
        )

    return resp


async def enrich_last_message(
    db: AsyncSession, channel: Channel, resp: ChannelResponse
) -> ChannelResponse:
    """Enrich channel with last message preview"""
    last_msg_stmt = (
        select(Message)
        .where(Message.channel_id == channel.id)
        .order_by(Message.id.desc())
        .limit(1)
    )
    last_msg_result = await db.execute(last_msg_stmt)
    last_msg: Optional[Message] = last_msg_result.scalar_one_or_none()

    if last_msg:
        sender_stmt = (
            select(User)
            .options(defer(User.hashed_password))
            .where(User.id == last_msg.user_id)
        )
        sender_result = await db.execute(sender_stmt)
        sender: Optional[User] = sender_result.scalar_one_or_none()

        resp.last_message = LastMessageInfo(
            id=last_msg.id,
            content=last_msg.content[:100] if last_msg.content else "",
            sender_id=sender.id if sender else None,
            sender_name=sender.full_name or sender.username if sender else "Система",
            sender_full_name=sender.full_name if sender else None,
            sender_rank=sender.rank if sender else None,
            created_at=last_msg.created_at,
        )
    else:
        # Explicitly set to None if no message found
        resp.last_message = None

    return resp


async def enrich_channel_settings(
    db: AsyncSession, channel: Channel, current_user_id: int, resp: ChannelResponse
) -> ChannelResponse:
    """Enrich channel with user-specific settings (pinned, muted)"""
    # Set pinning status
    if hasattr(channel, "is_pinned"):
        resp.is_pinned = channel.is_pinned
    else:
        stmt = select(ChannelMember.is_pinned).where(
            ChannelMember.channel_id == channel.id,
            ChannelMember.user_id == current_user_id,
        )
        result = await db.execute(stmt)
        resp.is_pinned = result.scalar() or False

    # Set mute status
    if hasattr(channel, "mute_until"):
        resp.mute_until = channel.mute_until
    else:
        stmt = select(ChannelMember.mute_until).where(
            ChannelMember.channel_id == channel.id,
            ChannelMember.user_id == current_user_id,
        )
        result = await db.execute(stmt)
        resp.mute_until = result.scalar()

    return resp
