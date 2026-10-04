from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.household import Household
from app.api.deps import get_current_household, verify_csrf
from app.schemas.domain import (
    DocumentOut, DocumentCreate, DocumentUpdate,
    ExtractedFieldOut, ExtractedFieldUpdate, FieldConfirmRequest,
    ReadinessScoreOut, ReadinessResponse,
    TaskOut, TaskCreate, TaskUpdate
)
from app.services.domain_service import DocumentService, FieldService, ScoreService, TaskService
from app.services.storage_service import StorageService
from app.services.extraction_service import ExtractionService
from app.services.readiness_service import ReadinessService
from app.models.domain import Document

docs_router = APIRouter(prefix="/documents", tags=["documents"])
fields_router = APIRouter(prefix="/fields", tags=["fields"])
scores_router = APIRouter(prefix="/scores", tags=["scores"])
tasks_router = APIRouter(prefix="/tasks", tags=["tasks"])

# -- Documents --
@docs_router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return DocumentService.get_documents(db, hh.id)

@docs_router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
def create_document_metadata(doc_in: DocumentCreate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    """Backward compatible metadata-only document creation"""
    return DocumentService.create_document(db, hh.id, doc_in)

@docs_router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    hh: Household = Depends(get_current_household)
):
    """Multipart document upload with secure storage and basic extraction"""
    mime_type = file.content_type or "application/octet-stream"
    
    # Save the file securely
    try:
        storage_ref = await StorageService.save_upload_file(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file securely")

    # Create DB Record
    doc = Document(
        household_id=hh.id,
        filename=file.filename or "unknown",
        document_type=mime_type,
        storage_reference=storage_ref,
        upload_status="UPLOADED"
    )
    db.add(doc)
    
    try:
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        StorageService.delete_file(storage_ref)
        raise HTTPException(status_code=500, detail="Failed to save document record")
        
    # Trigger processing
    ExtractionService.process_document(db, doc)
    
    return doc

@docs_router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@docs_router.get("/{doc_id}/fields", response_model=List[ExtractedFieldOut])
def get_document_fields(doc_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return FieldService.get_fields_for_document(db, doc_id)

@docs_router.get("/{doc_id}/download")
def download_document(doc_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not doc.storage_reference:
        raise HTTPException(status_code=404, detail="Document file not found")
        
    file_path = StorageService.get_file_path(doc.storage_reference)
    return FileResponse(file_path, media_type=doc.document_type, filename=doc.filename)

@docs_router.patch("/{doc_id}", response_model=DocumentOut, dependencies=[Depends(verify_csrf)])
def update_document(doc_id: str, doc_in: DocumentUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentService.update_document(db, doc, doc_in)

@docs_router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_csrf)])
def delete_document(doc_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    doc = DocumentService.get_document(db, doc_id, hh.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove from storage
    if doc.storage_reference:
        StorageService.delete_file(doc.storage_reference)
        
    DocumentService.delete_document(db, doc)

# -- Fields --
@fields_router.get("/{field_id}", response_model=ExtractedFieldOut)
def get_field(field_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    field = FieldService.get_field(db, field_id)
    if not field or not field.document or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

@fields_router.patch("/{field_id}", response_model=ExtractedFieldOut, dependencies=[Depends(verify_csrf)])
def update_field(field_id: str, field_in: ExtractedFieldUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    field = FieldService.get_field(db, field_id)
    if not field or not field.document or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if field_in.confirmation_status and field_in.confirmation_status not in ["UNCONFIRMED", "CONFIRMED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid confirmation_status value")

    return FieldService.update_field(db, field, field_in)

@fields_router.post("/{field_id}/confirm", response_model=ExtractedFieldOut, dependencies=[Depends(verify_csrf)])
def confirm_field(
    field_id: str, 
    body: Optional[FieldConfirmRequest] = None, 
    db: Session = Depends(get_db), 
    hh: Household = Depends(get_current_household)
):
    field = FieldService.get_field(db, field_id)
    if not field or not field.document or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    
    new_value = body.extracted_value if body else None
    return FieldService.confirm_field(db, field, new_value)

@fields_router.post("/{field_id}/reject", response_model=ExtractedFieldOut, dependencies=[Depends(verify_csrf)])
def reject_field(
    field_id: str, 
    db: Session = Depends(get_db), 
    hh: Household = Depends(get_current_household)
):
    field = FieldService.get_field(db, field_id)
    if not field or not field.document or field.document.household_id != hh.id:
        raise HTTPException(status_code=404, detail="Field not found")
    return FieldService.reject_field(db, field)

# -- Scores --
@scores_router.get("", response_model=ReadinessResponse)
def get_readiness_scores(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return ReadinessService.get_household_scores(db, hh.id)

@scores_router.get("/raw", response_model=List[ReadinessScoreOut])
def list_raw_scores(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return ScoreService.get_scores(db, hh.id)

@scores_router.post("/recalculate", response_model=ReadinessResponse, dependencies=[Depends(verify_csrf)])
def recalculate_scores(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return ReadinessService.calculate_and_save_scores(db, hh.id)

# -- Tasks --
@tasks_router.get("", response_model=List[TaskOut])
def list_tasks(db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return TaskService.get_tasks(db, hh.id)

@tasks_router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    return TaskService.create_task(db, hh.id, task_in)

@tasks_router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@tasks_router.patch("/{task_id}", response_model=TaskOut, dependencies=[Depends(verify_csrf)])
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskService.update_task(db, task, task_in)

@tasks_router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_csrf)])
def delete_task(task_id: str, db: Session = Depends(get_db), hh: Household = Depends(get_current_household)):
    task = TaskService.get_task(db, task_id, hh.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    TaskService.delete_task(db, task)
