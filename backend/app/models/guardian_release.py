from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GuardianReleaseRequest(Base):
    __tablename__ = "guardian_release_requests"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
    )

    household_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "households.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    initiated_by: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    threshold: Mapped[int] = mapped_column(
        nullable=False,
        default=2,
    )

    reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    released_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    approvals: Mapped[list["GuardianReleaseApproval"]] = relationship(
        "GuardianReleaseApproval",
        cascade="all, delete-orphan",
        foreign_keys="GuardianReleaseApproval.release_request_id",
    )


class GuardianReleaseApproval(Base):
    __tablename__ = "guardian_release_approvals"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
    )

    release_request_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "guardian_release_requests.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    guardian_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey(
            "guardians.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    responded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "release_request_id",
            "guardian_id",
            name="uq_release_request_guardian",
        ),
    )

    guardian = relationship(
        "Guardian",
        foreign_keys=[guardian_id],
    )
    