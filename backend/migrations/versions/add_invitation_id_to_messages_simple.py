"""add_invitation_id_to_messages_simple

Revision ID: add_invitation_id_simple
Revises: 22f1a8230923
Create Date: 2026-01-24 11:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_invitation_id_simple'
down_revision: Union[str, None] = '22f1a8230923'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add invitation_id column to messages table
    op.add_column('messages', sa.Column('invitation_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_messages_invitation_id'), 'messages', ['invitation_id'], unique=False)


def downgrade() -> None:
    # Remove invitation_id column from messages table
    op.drop_index(op.f('ix_messages_invitation_id'), table_name='messages')
    op.drop_column('messages', 'invitation_id')