
"""add guardian release requests

Revision ID: 2a989a386bee
Revises: dc58c8276f9a
Create Date: 2026-10-05 22:33:27.192134

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic.
revision: str = "2a989a386bee"
down_revision: Union[str, Sequence[str], None] = "dc58c8276f9a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create Guardian Release Request and Approval tables."""

    # 1. Guardian release requests
    op.create_table(
        "guardian_release_requests",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("household_id", sa.String(length=36), nullable=False),
        sa.Column("initiated_by", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("threshold", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("released_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["household_id"],
            ["households.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["initiated_by"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    with op.batch_alter_table(
        "guardian_release_requests",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            "ix_guardian_release_requests_household_id",
            ["household_id"],
            unique=False,
        )
        batch_op.create_index(
            "ix_guardian_release_requests_initiated_by",
            ["initiated_by"],
            unique=False,
        )
        batch_op.create_index(
            "ix_guardian_release_requests_status",
            ["status"],
            unique=False,
        )

    # 2. Individual Guardian approvals
    op.create_table(
        "guardian_release_approvals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("release_request_id", sa.String(length=36), nullable=False),
        sa.Column("guardian_id", sa.String(length=36), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["guardian_id"],
            ["guardians.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["release_request_id"],
            ["guardian_release_requests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "release_request_id",
            "guardian_id",
            name="uq_release_request_guardian",
        ),
    )

    with op.batch_alter_table(
        "guardian_release_approvals",
        schema=None,
    ) as batch_op:
        batch_op.create_index(
            "ix_guardian_release_approvals_guardian_id",
            ["guardian_id"],
            unique=False,
        )
        batch_op.create_index(
            "ix_guardian_release_approvals_release_request_id",
            ["release_request_id"],
            unique=False,
        )
        batch_op.create_index(
            "ix_guardian_release_approvals_status",
            ["status"],
            unique=False,
        )


def downgrade() -> None:
    """Remove only the tables created by this migration."""

    # 1. Remove approval indexes and table.
    with op.batch_alter_table(
        "guardian_release_approvals",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            "ix_guardian_release_approvals_status"
        )
        batch_op.drop_index(
            "ix_guardian_release_approvals_release_request_id"
        )
        batch_op.drop_index(
            "ix_guardian_release_approvals_guardian_id"
        )

    op.drop_table("guardian_release_approvals")

    # 2. Remove release request indexes and table.
    with op.batch_alter_table(
        "guardian_release_requests",
        schema=None,
    ) as batch_op:
        batch_op.drop_index(
            "ix_guardian_release_requests_status"
        )
        batch_op.drop_index(
            "ix_guardian_release_requests_initiated_by"
        )
        batch_op.drop_index(
            "ix_guardian_release_requests_household_id"
        )

    op.drop_table("guardian_release_requests")
