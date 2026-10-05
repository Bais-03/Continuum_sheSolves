"""add guardian invitations

Revision ID: dc58c8276f9a
Revises: 8e9cab90823c
Create Date: 2026-10-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "dc58c8276f9a"
down_revision: Union[str, Sequence[str], None] = "8e9cab90823c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the guardian invitations table."""

    op.create_table(
        "guardian_invitations",
        sa.Column(
            "id",
            sa.String(length=36),
            nullable=False,
        ),
        sa.Column(
            "guardian_id",
            sa.String(length=36),
            nullable=False,
        ),
        sa.Column(
            "token_hash",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "invited_email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["guardian_id"],
            ["guardians.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )

    op.create_index(
        "ix_guardian_invitations_guardian_id",
        "guardian_invitations",
        ["guardian_id"],
        unique=False,
    )

    op.create_index(
        "ix_guardian_invitations_token_hash",
        "guardian_invitations",
        ["token_hash"],
        unique=True,
    )


def downgrade() -> None:
    """Remove the guardian invitations table."""

    op.drop_index(
        "ix_guardian_invitations_token_hash",
        table_name="guardian_invitations",
    )

    op.drop_index(
        "ix_guardian_invitations_guardian_id",
        table_name="guardian_invitations",
    )

    op.drop_table("guardian_invitations")