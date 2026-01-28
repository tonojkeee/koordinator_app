from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ChannelInvitationCreate(BaseModel):
    """Схема для создания приглашения в канал"""

    channel_id: int = Field(..., description="ID канала")
    invitee_email: EmailStr = Field(..., description="Email приглашаемого пользователя")
    role: str = Field("member", description="Роль в канале")
    message: Optional[str] = Field(
        None, max_length=500, description="Сообщение к приглашению"
    )
    expires_hours: Optional[int] = Field(
        24, ge=1, le=168, description="Время действия в часах (1-168)"
    )


class ChannelInvitationResponse(BaseModel):
    """Схема для ответа с информацией о приглашении"""

    id: int
    channel_id: int
    channel_name: str
    channel_visibility: str
    inviter_id: int
    inviter_name: str
    invitee_email: str
    status: str
    role: str
    token: str
    created_at: datetime
    expires_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


class ChannelInvitationList(BaseModel):
    """Схема для списка приглашений"""

    invitations: list[ChannelInvitationResponse]
    total: int


class InvitationAccept(BaseModel):
    """Схема для принятия приглашения"""

    invitation_id: int


class InvitationDecline(BaseModel):
    """Схема для отклонения приглашения"""

    invitation_id: int
    reason: Optional[str] = Field(
        None, max_length=500, description="Причина отклонения"
    )


class PendingInvitations(BaseModel):
    """Схема для списка ожидающих приглашений текущего пользователя"""

    invitations: list[ChannelInvitationResponse]


class ChannelWithInvitations(BaseModel):
    """Схема канала с информацией о приглашениях"""

    id: int
    name: str
    description: Optional[str]
    visibility: str
    created_by: int
    is_direct: bool
    pending_invitations_count: int = Field(default=0)
    members_count: int = Field(default=0)

    class Config:
        from_attributes = True
