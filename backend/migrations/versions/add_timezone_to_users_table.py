"""add timezone to users table

Revision ID: add_timezone
Revises: 2fba65b8ba89
Create Date: 2026-01-24 06:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_timezone'
down_revision: Union[str, None] = '2fba65b8ba89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('timezone', sa.String(length=50), nullable=False, server_default='UTC'))


def downgrade() -> None:
    op.drop_column('users', 'timezone')