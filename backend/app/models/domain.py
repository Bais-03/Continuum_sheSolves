import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

def _uuid() -> str:
    return str(uuid.uuid4())

def _now() -> datetime:
    return datetime.now(timezone.utc)

class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id", ondelete="CASCADE"), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[Optional[str]] = mapped_column(String(100))
    storage_reference: Mapped[Optional[str]] = mapped_column(String(500))
    upload_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    fields: Mapped[List["ExtractedField"]] = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    field_label: Mapped[str] = mapped_column(String(100), nullable=False)
    extracted_value: Mapped[Optional[str]] = mapped_column(Text)
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    readiness_dimension: Mapped[Optional[str]] = mapped_column(String(100))
    confirmation_status: Mapped[str] = mapped_column(String(50), default="UNCONFIRMED", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    document: Mapped["Document"] = relationship("Document", back_populates="fields")

class ReadinessScore(Base):
    __tablename__ = "readiness_scores"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id", ondelete="CASCADE"), index=True, nullable=False)
    dimension: Mapped[str] = mapped_column(String(100), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    calculation_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    priority: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="TODO", nullable=False)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)
