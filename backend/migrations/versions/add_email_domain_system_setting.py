"""add email domain system setting

Revision ID: add_email_domain_system_setting
Revises: ec814d867c58_add_is_spam_column_to_email_messages
Create Date: 2025-01-24 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'add_email_domain_system_setting'
down_revision = 'ec814d867c58_add_is_spam_column_to_email_messages'
branch_labels = None
depends_on = None


def upgrade():
    """Add email domain system setting if it doesn't exist"""
    # Create a connection to execute raw SQL
    connection = op.get_bind()
    
    # Check if the setting already exists
    result = connection.execute(
        text("SELECT COUNT(*) FROM system_settings WHERE key = 'internal_email_domain'")
    ).scalar()
    
    if result == 0:
        # Insert the email domain setting
        connection.execute(
            text("""
                INSERT INTO system_settings (key, value, type, description, is_public, "group")
                VALUES ('internal_email_domain', '40919.com', 'str', 'Домен для внутренней почты', 1, 'email')
            """)
        )
    
    # Add other email-related settings if they don't exist
    email_settings = [
        ('email_smtp_host', '127.0.0.1', 'str', 'SMTP Хост', 0, 'email'),
        ('email_smtp_port', '2525', 'int', 'SMTP Порт', 0, 'email'),
        ('email_max_attachment_size_mb', '25', 'int', 'Максимальный размер одного вложения (МБ)', 1, 'email'),
        ('email_max_total_attachment_size_mb', '50', 'int', 'Максимальный общий размер вложений (МБ)', 1, 'email'),
        ('email_allowed_file_types', '.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.jpg,.png,.txt', 'str', 'Разрешенные типы вложений', 1, 'email'),
    ]
    
    for key, value, setting_type, description, is_public, group in email_settings:
        result = connection.execute(
            text(f"SELECT COUNT(*) FROM system_settings WHERE key = '{key}'")
        ).scalar()
        
        if result == 0:
            connection.execute(
                text(f"""
                    INSERT INTO system_settings (key, value, type, description, is_public, "group")
                    VALUES ('{key}', '{value}', '{setting_type}', '{description}', {is_public}, '{group}')
                """)
            )


def downgrade():
    """Remove email domain system setting"""
    connection = op.get_bind()
    
    # Remove email-related settings
    email_setting_keys = [
        'internal_email_domain',
        'email_smtp_host', 
        'email_smtp_port',
        'email_max_attachment_size_mb',
        'email_max_total_attachment_size_mb',
        'email_allowed_file_types'
    ]
    
    for key in email_setting_keys:
        connection.execute(
            text(f"DELETE FROM system_settings WHERE key = '{key}'")
        )