from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.modules.chat.models import Channel, ChannelMember, ChannelInvitation
from app.modules.chat.invitations import (
    ChannelInvitationCreate,
    ChannelInvitationResponse,
    ChannelInvitationList,
    PendingInvitations,
    ChannelWithInvitations
)
from app.modules.auth.models import User
from app.modules.chat.events import InvitationCreated
from app.core.events import event_bus


class InvitationService:
    """Service for channel invitation operations"""
    
    @staticmethod
    async def create_invitation(
        db: AsyncSession,
        invitation_data: ChannelInvitationCreate,
        inviter_id: int
    ) -> ChannelInvitationResponse:
        """Create a new channel invitation"""
        # Verify channel exists and is private
        channel_result = await db.execute(
            select(Channel).where(Channel.id == invitation_data.channel_id)
        )
        channel = channel_result.scalar_one_or_none()
        
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        
        if channel.visibility == "public":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot invite users to public channels"
            )
        
        # Verify inviter is channel member
        member_result = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == invitation_data.channel_id,
                    ChannelMember.user_id == inviter_id
                )
            )
        )
        member = member_result.scalar_one_or_none()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only channel members can invite users"
            )
        
        # Check if invitee is already a member (by email)
        user_result = await db.execute(
            select(User).where(User.email == invitation_data.invitee_email)
        )
        invitee_user = user_result.scalar_one_or_none()
        
        if invitee_user:
            existing_member_result = await db.execute(
                select(ChannelMember).where(
                    and_(
                        ChannelMember.channel_id == invitation_data.channel_id,
                        ChannelMember.user_id == invitee_user.id
                    )
                )
            )
            existing_member = existing_member_result.scalar_one_or_none()
            
            if existing_member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this channel"
                )
        
        # Check for existing pending invitation
        existing_invitation_result = await db.execute(
            select(ChannelInvitation).where(
                and_(
                    ChannelInvitation.channel_id == invitation_data.channel_id,
                    ChannelInvitation.invitee_email == invitation_data.invitee_email,
                    ChannelInvitation.status == "pending"
                )
            )
        )
        existing_invitation = existing_invitation_result.scalar_one_or_none()
        
        if existing_invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a pending invitation to this channel"
            )
        
        # Get inviter info
        inviter_result = await db.execute(
            select(User).where(User.id == inviter_id)
        )
        inviter = inviter_result.scalar_one_or_none()
        
        # Create invitation
        expires_at = datetime.now(timezone.utc) + timedelta(hours=invitation_data.expires_hours)
        invitation = ChannelInvitation(
            channel_id=invitation_data.channel_id,
            inviter_id=inviter_id,
            invitee_email=invitation_data.invitee_email,
            role=invitation_data.role,
            message=invitation_data.message,
            token=str(uuid.uuid4()),
            expires_at=expires_at
        )
        
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)
        
        # Publish invitation created event for notifications
        event = InvitationCreated(
            invitation_id=invitation.id,
            channel_id=channel.id,
            channel_name=channel.name,
            inviter_id=inviter.id,
            inviter_name=inviter.full_name or inviter.username,
            invitee_email=invitation_data.invitee_email,
            message=invitation_data.message
        )
        await event_bus.publish(event)
        
        return InvitationService._invitation_to_response(invitation, channel, inviter)
    
    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        invitation_id: int,
        user_id: int
    ) -> Channel:
        """Accept a channel invitation"""
        invitation_result = await db.execute(
            select(ChannelInvitation)
            .options(selectinload(ChannelInvitation.channel))
            .where(ChannelInvitation.id == invitation_id)
        )
        invitation = invitation_result.scalar_one_or_none()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )
        
        # Verify email matches
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user or user.email != invitation.invitee_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation is for a different email address"
            )
        
        # Verify invitation is pending and not expired
        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invitation has already been {invitation.status}"
            )
        
        if invitation.expires_at and invitation.expires_at < datetime.now(timezone.utc):
            invitation.status = "expired"
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired"
            )
        
        # Check if user is already a member
        is_member = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == invitation.channel_id,
                    ChannelMember.user_id == user_id
                )
            )
        )
        if is_member.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this channel"
            )
        
        # Update invitation status
        invitation.status = "accepted"
        invitation.responded_at = datetime.now(timezone.utc)
        invitation.invitee_user_id = user_id
        
        # Add user to channel
        member = ChannelMember(
            channel_id=invitation.channel_id,
            user_id=user_id,
            role=invitation.role
        )
        db.add(member)
        
        await db.commit()
        await db.refresh(invitation.channel)
        
        return invitation.channel
    
    @staticmethod
    async def decline_invitation(
        db: AsyncSession,
        invitation_id: int,
        user_id: int,
        reason: Optional[str] = None
    ) -> bool:
        """Decline a channel invitation"""
        invitation_result = await db.execute(
            select(ChannelInvitation).where(ChannelInvitation.id == invitation_id)
        )
        invitation = invitation_result.scalar_one_or_none()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )
        
        # Verify email matches
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user or user.email != invitation.invitee_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This invitation is for a different email address"
            )
        
        # Verify invitation is pending
        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invitation has already been {invitation.status}"
            )
        
        # Update invitation status
        invitation.status = "declined"
        invitation.responded_at = datetime.now(timezone.utc)
        
        await db.commit()
        return True
    
    @staticmethod
    async def get_pending_invitations(
        db: AsyncSession,
        user_id: int
    ) -> PendingInvitations:
        """Get all pending invitations for a user"""
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        invitations_result = await db.execute(
            select(ChannelInvitation)
            .options(
                selectinload(ChannelInvitation.channel),
                selectinload(ChannelInvitation.inviter)
            )
            .where(
                and_(
                    ChannelInvitation.invitee_email == user.email,
                    ChannelInvitation.status == "pending",
                    or_(
                        ChannelInvitation.expires_at.is_(None),
                        ChannelInvitation.expires_at > datetime.now(timezone.utc)
                    )
                )
            )
            .order_by(ChannelInvitation.created_at.desc())
        )
        
        invitations = []
        for invitation in invitations_result.scalars().all():
            response = InvitationService._invitation_to_response(
                invitation,
                invitation.channel,
                invitation.inviter
            )
            invitations.append(response)
        
        return PendingInvitations(invitations=invitations)
    
    @staticmethod
    async def get_channel_invitations(
        db: AsyncSession,
        channel_id: int,
        user_id: int,
        include_expired: bool = False
    ) -> ChannelInvitationList:
        """Get all invitations for a channel (admin only)"""
        # Verify user is admin of the channel
        member_result = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == channel_id,
                    ChannelMember.user_id == user_id,
                    ChannelMember.role.in_(["admin", "owner"])
                )
            )
        )
        member = member_result.scalar_one_or_none()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only channel admins can view invitations"
            )
        
        # Get invitations
        query = (
            select(ChannelInvitation)
            .options(
                selectinload(ChannelInvitation.channel),
                selectinload(ChannelInvitation.inviter)
            )
            .where(ChannelInvitation.channel_id == channel_id)
        )
        
        if not include_expired:
            query = query.where(
                or_(
                    ChannelInvitation.expires_at.is_(None),
                    ChannelInvitation.expires_at > datetime.now(timezone.utc)
                )
            )
        
        query = query.order_by(ChannelInvitation.created_at.desc())
        
        result = await db.execute(query)
        
        invitations = []
        for invitation in result.scalars().all():
            response = InvitationService._invitation_to_response(
                invitation,
                invitation.channel,
                invitation.inviter
            )
            invitations.append(response)
        
        total_result = await db.execute(
            select(func.count(ChannelInvitation.id))
            .where(ChannelInvitation.channel_id == channel_id)
        )
        total = total_result.scalar()
        
        return ChannelInvitationList(invitations=invitations, total=total)
    
    @staticmethod
    async def cancel_invitation(
        db: AsyncSession,
        invitation_id: int,
        user_id: int
    ) -> bool:
        """Cancel a pending invitation (admin only)"""
        invitation_result = await db.execute(
            select(ChannelInvitation).where(ChannelInvitation.id == invitation_id)
        )
        invitation = invitation_result.scalar_one_or_none()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )
        
        # Verify user is admin of the channel
        member_result = await db.execute(
            select(ChannelMember).where(
                and_(
                    ChannelMember.channel_id == invitation.channel_id,
                    ChannelMember.user_id == user_id,
                    ChannelMember.role.in_(["admin", "owner"])
                )
            )
        )
        member = member_result.scalar_one_or_none()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only channel admins can cancel invitations"
            )
        
        # Can only cancel pending invitations
        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel {invitation.status} invitation"
            )
        
        invitation.status = "cancelled"
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_channels_with_invitations(
        db: AsyncSession,
        user_id: int
    ) -> List[ChannelWithInvitations]:
        """Get all channels where user has pending invitations or can invite others"""
        # Get channels where user is admin
        admin_channels_result = await db.execute(
            select(Channel)
            .join(ChannelMember)
            .where(
                and_(
                    ChannelMember.user_id == user_id,
                    ChannelMember.role.in_(["admin", "owner"]),
                    Channel.visibility == "private"
                )
            )
            .distinct()
        )
        
        channels = []
        for channel in admin_channels_result.scalars().all():
            # Count pending invitations
            pending_result = await db.execute(
                select(func.count(ChannelInvitation.id))
                .where(
                    and_(
                        ChannelInvitation.channel_id == channel.id,
                        ChannelInvitation.status == "pending"
                    )
                )
            )
            pending_count = pending_result.scalar() or 0
            
            # Count total members
            members_result = await db.execute(
                select(func.count(ChannelMember.id))
                .where(ChannelMember.channel_id == channel.id)
            )
            members_count = members_result.scalar() or 0
            
            channel_with_info = ChannelWithInvitations(
                id=channel.id,
                name=channel.name,
                description=channel.description,
                visibility=channel.visibility,
                created_by=channel.created_by,
                is_direct=channel.is_direct,
                pending_invitations_count=pending_count,
                members_count=members_count
            )
            channels.append(channel_with_info)
        
        return channels
    
    @staticmethod
    def _invitation_to_response(
        invitation: ChannelInvitation,
        channel: Channel,
        inviter: User
    ) -> ChannelInvitationResponse:
        """Convert invitation model to response schema"""
        return ChannelInvitationResponse(
            id=invitation.id,
            channel_id=invitation.channel_id,
            channel_name=channel.name,
            channel_visibility=channel.visibility,
            inviter_id=invitation.inviter_id,
            inviter_name=inviter.full_name or inviter.username,
            invitee_email=invitation.invitee_email,
            status=invitation.status,
            role=invitation.role,
            token=invitation.token,
            created_at=invitation.created_at,
            expires_at=invitation.expires_at,
            responded_at=invitation.responded_at
        )