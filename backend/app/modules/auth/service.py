from typing import Optional, Any
from sqlalchemy import select
from sqlalchemy.orm import joinedload, defer
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.auth.models import User, Unit
from app.modules.auth.schemas import UserCreate, UnitCreate
from app.core.security import get_password_hash, verify_password
from app.core.config_service import ConfigService


class UserService:

    @staticmethod
    async def validate_password(db: AsyncSession, password: str) -> None:
        from fastapi import HTTPException
        import re

        min_len = await ConfigService.get_value(db, "security_password_min_length", 8)
        require_digits = await ConfigService.get_value(
            db, "security_password_require_digits", False
        )
        require_upper = await ConfigService.get_value(
            db, "security_password_require_uppercase", False
        )

        if len(password) < int(min_len):
            raise HTTPException(
                status_code=400,
                detail=f"Password must be at least {min_len} characters long",
            )

        if require_digits and not re.search(r"\d", password):
            raise HTTPException(
                status_code=400, detail="Password must contain at least one digit"
            )

        if require_upper and not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least one uppercase letter",
            )

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        from app.core.config import get_settings

        settings = get_settings()

        await UserService.validate_password(db, user_data.password)

        hashed_password = get_password_hash(user_data.password)

        # Use ConfigService for runtime override, but fallback to settings env var
        email_domain = await ConfigService.get_value(
            db, "internal_email_domain", settings.internal_email_domain
        )
        email = f"{user_data.username}@{email_domain}"

        db_user = User(
            username=user_data.username,
            email=email,
            full_name=user_data.full_name,
            cabinet=None,
            phone_number=None,
            unit=None,
            role="user",
            hashed_password=hashed_password,
        )

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

        # Publish UserCreated event
        from app.core.events import event_bus
        from app.modules.auth.events import UserCreated

        await event_bus.publish(
            UserCreated(
                user_id=db_user.id, username=db_user.username, email=db_user.email
            )
        )

        return db_user

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Get user by username"""
        result = await db.execute(
            select(User)
            .where(User.username == username)
            .options(joinedload(User.unit), defer(User.hashed_password))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        from sqlalchemy import func

        result = await db.execute(
            select(User)
            .where(func.lower(User.email) == email.lower())
            .options(joinedload(User.unit), defer(User.hashed_password))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Get user by ID (excludes password hash for security)"""
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .options(defer(User.hashed_password))
            .options(joinedload(User.unit))
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_users(
        db: AsyncSession, limit: int = None, offset: int = 0
    ) -> list[User]:
        """
        Get all users with optional pagination.
        Excludes password hashes for security and performance.

        Args:
            limit: Maximum number of users to return (None = all)
            offset: Number of users to skip
        """
        stmt = (
            select(User)
            .options(defer(User.hashed_password))
            .options(joinedload(User.unit))
            .order_by(User.full_name)
        )

        if offset > 0:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int) -> bool:
        """
        Delete a user and all associated data.
        Relies on DB-level ON DELETE CASCADE for data integrity.
        Publishes UserDeleted event for external cleanup (files, etc).
        """
        from app.core.events import event_bus
        from app.modules.auth.events import UserDeleted

        # Get user with all needed data before deletion
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return False

        # Publish event for cleanup (physical files, etc.)
        await event_bus.publish(
            UserDeleted(
                user_id=user.id,
                username=user.username,
                email=user.email,
                avatar_url=user.avatar_url,
            )
        )

        # Delete user - DB cascades will handle Message, Document, EmailAccount etc.
        await db.delete(user)
        await db.commit()
        return True

    @staticmethod
    async def update_user_role(
        db: AsyncSession, user_id: int, role: str
    ) -> Optional[User]:
        """Update user role"""
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        user.role = role
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, username: str, password: str
    ) -> Optional[User]:
        """Authenticate a user - loads password hash for verification"""
        # Query user WITH password hash (don't defer it for authentication)
        result = await db.execute(
            select(User)
            .where(User.username == username)
            .options(joinedload(User.unit))  # Load unit but NOT defer password
        )
        user = result.scalar_one_or_none()

        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    async def update_user_unit(
        db: AsyncSession, user_id: int, unit_name: Optional[str]
    ) -> tuple[Optional[User], str]:
        """Update user unit by unit name. Returns (user, error_code) where error_code is 'ok', 'user_not_found', or 'unit_not_found'"""
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None, "user_not_found"

        if unit_name:
            # Find unit by name
            stmt = select(Unit).where(Unit.name == unit_name)
            result = await db.execute(stmt)
            unit = result.scalar_one_or_none()
            if unit:
                user.unit_id = unit.id
            else:
                return None, "unit_not_found"
        else:
            user.unit_id = None

        await db.commit()
        # Re-fetch with unit relationship loaded
        user = await UserService.get_user_by_id(db, user_id)
        return user, "ok"

    @staticmethod
    async def update_user_avatar(
        db: AsyncSession, user_id: int, avatar_url: str
    ) -> Optional[User]:
        """Update user avatar URL"""
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None
        user.avatar_url = avatar_url
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_user_profile(
        db: AsyncSession, user_id: int, update_data: Any
    ) -> Optional[User]:
        """Update user profile information"""
        user = await UserService.get_user_by_id(db, user_id)
        if not user:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        # Safeguard: never allow manual email update
        update_dict.pop("email", None)

        for field, value in update_dict.items():
            setattr(user, field, value)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def change_password(
        db: AsyncSession, user_id: int, password_data: Any
    ) -> bool:
        from app.core.security import verify_password, get_password_hash

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return False

        if not verify_password(password_data.current_password, user.hashed_password):
            return False

        # Validate new password
        await UserService.validate_password(db, password_data.new_password)

        user.hashed_password = get_password_hash(password_data.new_password)
        await db.commit()
        return True

    @staticmethod
    async def reset_password(db: AsyncSession, user_id: int, password: str) -> bool:
        """Reset user password (Admin)"""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return False

        # Validate new password
        await UserService.validate_password(db, password)

        user.hashed_password = get_password_hash(password)
        await db.commit()
        return True


class UnitService:
    """Service for unit operations"""

    @staticmethod
    async def get_all_units(db: AsyncSession) -> list[Unit]:
        """Get all units"""
        result = await db.execute(select(Unit).order_by(Unit.name))
        return list(result.scalars().all())

    @staticmethod
    async def create_unit(db: AsyncSession, unit_data: UnitCreate) -> Unit:
        """Create a new unit and its archive directory"""
        import os

        unit = Unit(name=unit_data.name, description=unit_data.description)
        db.add(unit)
        await db.commit()
        await db.refresh(unit)

        # Create directory for archive if it doesn't exist
        # We use the same path as in ArchiveService: uploads/archive/{unit_id}
        archive_dir = os.path.join("uploads/archive", str(unit.id))
        os.makedirs(archive_dir, exist_ok=True)

        return unit

    @staticmethod
    async def update_unit(
        db: AsyncSession, unit_id: int, update_data: Any
    ) -> Optional[Unit]:
        """Update a unit's details"""
        result = await db.execute(select(Unit).where(Unit.id == unit_id))
        unit = result.scalar_one_or_none()
        if not unit:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(unit, field, value)

        await db.commit()
        await db.refresh(unit)
        return unit

    @staticmethod
    async def delete_unit(db: AsyncSession, unit_id: int) -> bool:
        """Delete a unit, reset user associations, and clean up archive"""
        from sqlalchemy import update, delete
        from app.modules.archive.models import ArchiveFile, ArchiveFolder
        import shutil
        import os

        # 1. Find the unit
        result = await db.execute(select(Unit).where(Unit.id == unit_id))
        unit = result.scalar_one_or_none()
        if not unit:
            return False

        # 2. Reset unit_id for all users in this unit
        await db.execute(
            update(User).where(User.unit_id == unit_id).values(unit_id=None)
        )

        # 3. Clean up archive records in DB
        # Archive files and folders for this unit should be removed
        await db.execute(delete(ArchiveFile).where(ArchiveFile.unit_id == unit_id))
        await db.execute(delete(ArchiveFolder).where(ArchiveFolder.unit_id == unit_id))

        # 4. Clean up physical archive directory
        archive_dir = os.path.join("uploads/archive", str(unit_id))
        if os.path.exists(archive_dir):
            try:
                shutil.rmtree(archive_dir)
            except OSError:
                pass

        # 5. Delete the unit itself
        await db.delete(unit)
        await db.commit()
        return True
