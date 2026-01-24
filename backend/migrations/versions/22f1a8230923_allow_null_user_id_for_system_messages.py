"""allow_null_user_id_for_system_messages

Revision ID: 22f1a8230923
Revises: add_timezone
Create Date: 2026-01-24 10:57:14.400676

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22f1a8230923'
down_revision: Union[str, None] = 'add_timezone'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Allow NULL user_id in messages table for system messages
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.alter_column('user_id',
                              existing_type=sa.INTEGER(),
                              nullable=True)


def downgrade() -> None:
    # Revert to NOT NULL user_id (this will fail if there are system messages)
    with op.batch_alter_table('messages', schema=None) as batch_op:
        batch_op.alter_column('user_id',
                              existing_type=sa.INTEGER(),
                              nullable=False)
