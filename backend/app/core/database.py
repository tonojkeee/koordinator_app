from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy import select, delete, func, text, event
from app.core.config import get_settings
from typing import AsyncGenerator


import logging

logger = logging.getLogger(__name__)

settings = get_settings()


def create_engine_with_pool() -> AsyncEngine:
    """
    Create database engine with appropriate connection pooling.

    - SQLite: Uses NullPool (no pooling, single connection)
    - MySQL/PostgreSQL: Uses QueuePool with configurable size
    """
    common_args = {
        "echo": settings.debug,
        "future": True,
    }

    if settings.is_sqlite:
        # SQLite doesn't support connection pooling well
        # Use NullPool to create new connection each time
        logger.info("Database: Using SQLite with NullPool")
        return create_async_engine(
            settings.database_url, poolclass=NullPool, **common_args
        )
    else:
        # MySQL/PostgreSQL - use connection pooling
        logger.info(
            f"Database: Using connection pool "
            f"(size={settings.db_pool_size}, overflow={settings.db_max_overflow})"
        )
        return create_async_engine(
            settings.database_url,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_recycle=settings.db_pool_recycle,
            pool_pre_ping=True,  # Check connection health before use
            **common_args,
        )


# Create async engine with appropriate pooling
engine = create_engine_with_pool()

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Apply SQLite performance and concurrency optimizations.

    - WAL Mode: Allows concurrent reads and writes
    - busy_timeout: Retries when database is locked
    - synchronous=NORMAL: Improved write performance safely in WAL mode
    """
    if settings.is_sqlite:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")  # 5 seconds
        cursor.close()


class Base(DeclarativeBase):
    """Base class for all models"""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database - create all tables"""
    # Import all models here so they register with Base.metadata
    import app.modules.auth.models
    import app.modules.chat.models
    import app.modules.board.models
    import app.modules.archive.models
    import app.modules.admin.models
    import app.modules.tasks.models
    import app.modules.email.models

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
