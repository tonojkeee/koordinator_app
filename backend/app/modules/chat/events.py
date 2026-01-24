from app.core.events import Event
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True)
class MessageCreated(Event):
    message_id: int
    channel_id: int
    user_id: int
    content: str
    document_id: int | None = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass(frozen=True)
class InvitationCreated(Event):
    invitation_id: int
    channel_id: int
    channel_name: str
    inviter_id: int
    inviter_name: str
    invitee_email: str
    message: str | None = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
