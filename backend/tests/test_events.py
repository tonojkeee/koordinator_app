import pytest
from typing import Type
from dataclasses import dataclass
import asyncio

try:
    from app.core.events import Event, EventBus, event_bus

    EVENTS_MODULE_EXISTS = True
except ImportError:
    EVENTS_MODULE_EXISTS = False


@dataclass(frozen=True)
class MockEvent(Event):
    data: str


class TestEventBus:
    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    def test_event_bus_initializes_empty(self):
        bus = EventBus()
        assert bus._handlers == {}

    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    @pytest.mark.asyncio
    async def test_subscribe_handler(self):
        bus = EventBus()
        handler_called = False

        async def handler(event: MockEvent):
            nonlocal handler_called
            handler_called = True

        await bus.subscribe(MockEvent, handler)
        assert MockEvent in bus._handlers
        assert len(bus._handlers[MockEvent]) == 1

    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    @pytest.mark.asyncio
    async def test_subscribe_multiple_handlers(self):
        bus = EventBus()

        async def handler1(event: MockEvent):
            pass

        async def handler2(event: MockEvent):
            pass

        await bus.subscribe(MockEvent, handler1)
        await bus.subscribe(MockEvent, handler2)

        assert len(bus._handlers[MockEvent]) == 2

    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    @pytest.mark.asyncio
    async def test_publish_calls_handler(self):
        bus = EventBus()
        results = []

        async def handler(event: MockEvent):
            results.append(event.data)

        await bus.subscribe(MockEvent, handler)
        await bus.publish(MockEvent(data="test"))

        assert len(results) == 1
        assert results[0] == "test"

    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    @pytest.mark.asyncio
    async def test_publish_no_handlers(self):
        bus = EventBus()
        await bus.publish(MockEvent(data="test"))

    @pytest.mark.skipif(
        not EVENTS_MODULE_EXISTS, reason="events module not implemented yet"
    )
    @pytest.mark.asyncio
    async def test_publish_calls_all_handlers(self):
        bus = EventBus()
        results = []

        async def handler1(event: MockEvent):
            results.append("handler1")

        async def handler2(event: MockEvent):
            results.append("handler2")

        await bus.subscribe(MockEvent, handler1)
        await bus.subscribe(MockEvent, handler2)
        await bus.publish(MockEvent(data="test"))

        assert results == ["handler1", "handler2"]


def test_events_module_exists():
    assert EVENTS_MODULE_EXISTS
