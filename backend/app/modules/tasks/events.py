from dataclasses import dataclass
from typing import Optional
from app.core.events import Event


@dataclass(frozen=True)
class TaskCreated(Event):
    task_id: int
    title: str
    issuer_id: int
    assignee_id: int


@dataclass(frozen=True)
class TaskAssigned(Event):
    task_id: int
    title: str
    assignee_id: int
    issuer_id: int


@dataclass(frozen=True)
class TaskStatusChanged(Event):
    task_id: int
    title: str
    old_status: str
    new_status: str
    assignee_id: int
    issuer_id: int


@dataclass(frozen=True)
class TaskCompleted(Event):
    task_id: int
    title: str
    assignee_id: int
    issuer_id: int
