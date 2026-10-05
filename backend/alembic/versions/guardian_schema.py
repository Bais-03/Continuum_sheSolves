"""add guardian table

Revision ID: guardian_schema
Revises: d6e81f920161
Create Date: 2026-10-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "guardian_schema"
down_revision: Union[str, Sequence[str], None] = "d6e81f920161"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guardians",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column(
            "household_id",
            sa.String(length=36),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "phone",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "relationship_type",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_guardians_household_id",
        "guardians",
        ["household_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_guardians_household_id",
        table_name="guardians",
    )

    op.drop_table("guardians")