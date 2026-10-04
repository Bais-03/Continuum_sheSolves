from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.domain import Document, ExtractedField, ReadinessScore, Task
from app.schemas.domain import DocumentCreate, DocumentUpdate, ExtractedFieldCreate, ExtractedFieldUpdate, TaskCreate, TaskUpdate
from app.services.readiness_service import ReadinessService

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

    @staticmethod
    def delete_document(db: Session, doc: Document):
        household_id = doc.household_id
        db.delete(doc)
        db.commit()
        # Recalculate scores after document deletion
        ReadinessService.calculate_and_save_scores(db, household_id)

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
        status_changed = "confirmation_status" in update_data or "extracted_value" in update_data
        
        for k, v in update_data.items():
            setattr(field, k, v)
        field.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(field)

        if status_changed and field.document:
            ReadinessService.calculate_and_save_scores(db, field.document.household_id)

        return field

    @staticmethod
    def confirm_field(db: Session, field: ExtractedField, new_value: Optional[str] = None) -> ExtractedField:
        field.confirmation_status = "CONFIRMED"
        if new_value is not None:
            field.extracted_value = new_value
        field.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(field)

        if field.document:
            ReadinessService.calculate_and_save_scores(db, field.document.household_id)

        return field

    @staticmethod
    def reject_field(db: Session, field: ExtractedField) -> ExtractedField:
        field.confirmation_status = "REJECTED"
        field.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(field)

        if field.document:
            ReadinessService.calculate_and_save_scores(db, field.document.household_id)

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
