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
