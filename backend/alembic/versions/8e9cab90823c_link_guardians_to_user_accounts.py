"""link guardians to user accounts

Revision ID: 8e9cab90823c
Revises: guardian_schema
Create Date: 2026-10-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8e9cab90823c"
down_revision: Union[str, Sequence[str], None] = "guardian_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add optional link between a Guardian and a User account."""

    with op.batch_alter_table("guardians", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "user_id",
                sa.String(length=36),
                nullable=True,
            )
        )

        batch_op.create_index(
            "ix_guardians_user_id",
            ["user_id"],
            unique=True,
        )

        batch_op.create_foreign_key(
            "fk_guardians_user_id_users",
            "users",
            ["user_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    """Remove the Guardian-to-User account link."""

    with op.batch_alter_table("guardians", schema=None) as batch_op:
        batch_op.drop_constraint(
            "fk_guardians_user_id_users",
            type_="foreignkey",
        )

        batch_op.drop_index("ix_guardians_user_id")

        batch_op.drop_column("user_id")