import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


if TYPE_CHECKING:
    from app.models.household import Household
    from app.models.user import User
    from app.models.guardian_invitation import GuardianInvitation


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Guardian(Base):
    __tablename__ = "guardians"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=_uuid,
    )

    household_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("households.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional until the Guardian accepts an invitation
    # and creates/links their own Continuum account.
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    relationship_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_now,
        nullable=False,
    )

    household: Mapped["Household"] = relationship(
        "Household",
        back_populates="guardians",
    )

    user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[user_id],
    )

    invitations: Mapped[list["GuardianInvitation"]] = relationship(
        "GuardianInvitation",
        back_populates="guardian",
        cascade="all, delete-orphan",
    )