from typing import Optional, Any
from app.core.events import Event
from dataclasses import dataclass


@dataclass(frozen=True)
class UserCreated(Event):
    user_id: int
    username: str
    email: str


@dataclass(frozen=True)
class UserDeleted(Event):
    user_id: int
    username: str
    email: str
    avatar_url: Optional[str] = None


@dataclass(frozen=True)
class UserUpdated(Event):
    user_id: int
    changes: dict[str, Any]
