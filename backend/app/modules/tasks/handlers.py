import logging
from app.core.events import event_bus
from app.modules.tasks.events import TaskCreated, TaskAssigned, TaskStatusChanged, TaskCompleted
from app.core.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class TaskEventHandlers:
    """Handlers for task events"""

    @staticmethod
    async def on_task_created(task_id: int, title: str, issuer_id: int, assignee_id: int):
        logger.info(f"Task created: {task_id}, title: {title}, assignee: {assignee_id}")
        await event_bus.publish(TaskCreated(task_id=task_id, title=title, issuer_id=issuer_id, assignee_id=assignee_id))

        # Notify assignee via WebSocket (legacy direct call, should be handled by event subscriber eventually)
        # But keeping here for consistency with current architecture
        # Note: The router currently does this directly. We should move it here.
        pass

    @staticmethod
    async def on_task_assigned(task_id: int, title: str, assignee_id: int, issuer_id: int):
        logger.info(f"Task assigned: {task_id}, assignee: {assignee_id}")
        await event_bus.publish(TaskAssigned(task_id=task_id, title=title, assignee_id=assignee_id, issuer_id=issuer_id))

    @staticmethod
    async def on_task_status_changed(task_id: int, title: str, old_status: str, new_status: str, assignee_id: int, issuer_id: int):
        logger.info(f"Task status changed: {task_id}, {old_status} -> {new_status}")
        await event_bus.publish(TaskStatusChanged(
            task_id=task_id,
            title=title,
            old_status=old_status,
            new_status=new_status,
            assignee_id=assignee_id,
            issuer_id=issuer_id
        ))

    @staticmethod
    async def on_task_completed(task_id: int, title: str, assignee_id: int, issuer_id: int):
        logger.info(f"Task completed: {task_id}")
        await event_bus.publish(TaskCompleted(task_id=task_id, title=title, assignee_id=assignee_id, issuer_id=issuer_id))
