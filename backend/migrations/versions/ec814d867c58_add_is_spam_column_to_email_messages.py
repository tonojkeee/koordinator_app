"""add_is_spam_column_to_email_messages

Revision ID: ec814d867c58
Revises: 38a02d034ab7
Create Date: 2026-01-23 19:03:04.231899

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec814d867c58'
down_revision: Union[str, None] = '38a02d034ab7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing is_spam column to email_messages table
    op.add_column('email_messages', sa.Column('is_spam', sa.Boolean(), nullable=False, server_default='0'))
    op.create_index(op.f('ix_email_messages_is_spam'), 'email_messages', ['is_spam'], unique=False)


def downgrade() -> None:
    # Remove is_spam column and index
    op.drop_index(op.f('ix_email_messages_is_spam'), table_name='email_messages')
    op.drop_column('email_messages', 'is_spam')
