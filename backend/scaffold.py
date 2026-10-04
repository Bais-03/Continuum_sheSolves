import os

MODELS_DOMAIN = """
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
"""

SCHEMAS_DOMAIN = """
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class ExtractedFieldBase(BaseModel):
    field_label: str
    extracted_value: Optional[str] = None
    confidence: Optional[float] = None
    readiness_dimension: Optional[str] = None
    confirmation_status: Optional[str] = "UNCONFIRMED"

class ExtractedFieldCreate(ExtractedFieldBase):
    pass

class ExtractedFieldUpdate(BaseModel):
    extracted_value: Optional[str] = None
    confirmation_status: Optional[str] = None

class ExtractedFieldOut(ExtractedFieldBase):
    id: str
    document_id: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class DocumentBase(BaseModel):
    filename: str
    document_type: Optional[str] = None
    storage_reference: Optional[str] = None
    upload_status: Optional[str] = "PENDING"

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    upload_status: Optional[str] = None
    filename: Optional[str] = None

class DocumentOut(DocumentBase):
    id: str
    household_id: str
    created_at: datetime
    updated_at: datetime
    fields: List[ExtractedFieldOut] = []
    model_config = {"from_attributes": True}

class ReadinessScoreBase(BaseModel):
    dimension: str
    score: float
    weight: float

class ReadinessScoreOut(ReadinessScoreBase):
    id: str
    household_id: str
    calculation_timestamp: datetime
    model_config = {"from_attributes": True}

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    status: Optional[str] = "TODO"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskOut(TaskBase):
    id: str
    household_id: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
"""

API_DEPS = """
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.household import Household
from app.services.auth_service import get_current_user

def get_current_household(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Household:
    household = db.query(Household).filter(Household.owner_id == current_user.id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    return household
"""

SERVICES_DOMAIN = """
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.domain import Document, ExtractedField, ReadinessScore, Task
from app.schemas.domain import DocumentCreate, DocumentUpdate, ExtractedFieldCreate, ExtractedFieldUpdate, TaskCreate, TaskUpdate

class DocumentService:
    @staticmethod
    def get_documents(db: Session, household_id: str) -> List[Document]:
        return db.query(Document).filter(Document.household_id == household_id).all()
        
    @staticmethod
    def get_document(db: Session, doc_id: str, household_id: str) -> Optional[Document]:
        return db.query(Document).filter(Document.id == doc_id, Document.household_id == household_id).first()
        
    @staticmethod
    def create_document(db: Session, household_id: str, doc_in: DocumentCreate) -> Document:
        doc = Document(**doc_in.model_dump(), household_id=household_id)
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
        
    @staticmethod
    def update_document(db: Session, doc: Document, doc_in: DocumentUpdate) -> Document:
        update_data = doc_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(doc, field, value)
        db.commit()
        db.refresh(doc)
        return doc

class FieldService:
    @staticmethod
    def get_fields_for_document(db: Session, doc_id: str) -> List[ExtractedField]:
        return db.query(ExtractedField).filter(ExtractedField.document_id == doc_id).all()
        
    @staticmethod
    def get_field(db: Session, field_id: str) -> Optional[ExtractedField]:
        return db.query(ExtractedField).filter(ExtractedField.id == field_id).first()
        
    @staticmethod
    def update_field(db: Session, field: ExtractedField, field_in: ExtractedFieldUpdate) -> ExtractedField:
        update_data = field_in.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(field, k, v)
        db.commit()
        db.refresh(field)
        return field

class ScoreService:
    @staticmethod
    def get_scores(db: Session, household_id: str) -> List[ReadinessScore]:
        return db.query(ReadinessScore).filter(ReadinessScore.household_id == household_id).all()

class TaskService:
    @staticmethod
    def get_tasks(db: Session, household_id: str) -> List[Task]:
        return db.query(Task).filter(Task.household_id == household_id).all()
        
    @staticmethod
    def get_task(db: Session, task_id: str, household_id: str) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id, Task.household_id == household_id).first()
        
    @staticmethod
    def create_task(db: Session, household_id: str, task_in: TaskCreate) -> Task:
        task = Task(**task_in.model_dump(), household_id=household_id)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
        
    @staticmethod
    def update_task(db: Session, task: Task, task_in: TaskUpdate) -> Task:
        update_data = task_in.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(task, k, v)
        db.commit()
        db.refresh(task)
        return task
        
    @staticmethod
    def delete_task(db: Session, task: Task):
        db.delete(task)
        db.commit()
"""

API_DOMAIN = """
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.household import Household
from app.api.deps import get_current_household
from app.schemas.domain import (
    DocumentOut, DocumentCreate, DocumentUpdate,
    ExtractedFieldOut, ExtractedFieldUpdate,
    ReadinessScoreOut,
    TaskOut, TaskCreate, TaskUpdate
)
from app.services.domain_service import DocumentService, FieldService, ScoreService, TaskService

docs_router = APIRouter(prefix="/documents", tags=["documents"])
fields_router = APIRouter(prefix="/fields", tags=["fields"])
scores_router = APIRouter(prefix="/scores", tags=["scores"])
tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])

# -- Documents --
@docs_router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return DocumentService.get_documents(db, hh.id)

@docs_router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(doc_in: DocumentCreate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return DocumentService.create_document(db, hh.id, doc_in)

@docs_router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@docs_router.patch("/{doc_id}", response_model=DocumentOut)
def update_document(doc_id: str, doc_in: DocumentUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentService.update_document(db, doc, doc_in)

# -- Fields --
# Fields are accessed globally but ownership is checked via document
@fields_router.get("/{field_id}", response_model=ExtractedFieldOut)
def get_field(field_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    field = FieldService.get_field(db, field_id)
    if not field or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

@fields_router.patch("/{field_id}", response_model=ExtractedFieldOut)
def update_field(field_id: str, field_in: ExtractedFieldUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    field = FieldService.get_field(db, field_id)
    if not field or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    return FieldService.update_field(db, field, field_in)

# -- Scores --
@scores_router.get("", response_model=List[ReadinessScoreOut])
def list_scores(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return ScoreService.get_scores(db, hh.id)

# -- Tasks --
@tasks_router.get("", response_model=List[TaskOut])
def list_tasks(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return TaskService.get_tasks(db, hh.id)

@tasks_router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return TaskService.create_task(db, hh.id, task_in)

@tasks_router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@tasks_router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskService.update_task(db, task, task_in)

@tasks_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    TaskService.delete_task(db, task)
"""

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\\n")
    print(f"Written: {path}")

def update_router(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "docs_router" not in content:
        content = content.replace(
            "from app.api.endpoints import auth, households",
            "from app.api.endpoints import auth, households\\nfrom app.api.endpoints.domain import docs_router, fields_router, scores_router, tasks_router"
        )
        content += "\\napi_router.include_router(docs_router)"
        content += "\\napi_router.include_router(fields_router)"
        content += "\\napi_router.include_router(scores_router)"
        content += "\\napi_router.include_router(tasks_router)\\n"
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated: API Router")

def update_models_init(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if "app.models.domain" not in content:
        content += "\\nfrom app.models.domain import Document, ExtractedField, ReadinessScore, Task\\n"
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated: Models __init__")

base = "c:/Users/shita/OneDrive/Desktop/shecodes/backend/app/"
write_file(os.path.join(base, "models", "domain.py"), MODELS_DOMAIN)
write_file(os.path.join(base, "schemas", "domain.py"), SCHEMAS_DOMAIN)
write_file(os.path.join(base, "api", "deps.py"), API_DEPS)
write_file(os.path.join(base, "services", "domain_service.py"), SERVICES_DOMAIN)
write_file(os.path.join(base, "api", "endpoints", "domain.py"), API_DOMAIN)

update_router(os.path.join(base, "api", "router.py"))
update_models_init(os.path.join(base, "models", "__init__.py"))
print("Done scaffold.")
