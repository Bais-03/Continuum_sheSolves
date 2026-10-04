import os
from sqlalchemy.orm import Session
from app.models.domain import Document, ExtractedField
from app.services.storage_service import StorageService
from app.services.readiness_service import ReadinessService, classify_dimension

class ExtractionService:
    SUPPORTED_MIME_TYPES = ["text/plain"]
    
    @staticmethod
    def is_supported(mime_type: str) -> bool:
        return mime_type in ExtractionService.SUPPORTED_MIME_TYPES
        
    @staticmethod
    def process_document(db: Session, document: Document):
        if not document.storage_reference:
            document.upload_status = "FAILED"
            db.commit()
            return
            
        # For this prototype phase, we only support text/plain deterministic parsing
        if document.document_type != "text/plain":
            # Unsupported formats skip extraction but mark as completed for storage
            document.upload_status = "COMPLETED"
            db.commit()
            ReadinessService.calculate_and_save_scores(db, document.household_id)
            return
            
        try:
            document.upload_status = "PROCESSING"
            db.commit()
            
            file_path = StorageService.get_file_path(document.storage_reference)
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Deterministic extraction: Key: Value pairs per line
            lines = content.splitlines()
            for line in lines:
                if ":" in line:
                    parts = line.split(":", 1)
                    label = parts[0].strip()
                    value = parts[1].strip()
                    
                    if label and value:
                        dim_key = classify_dimension(label)
                        field = ExtractedField(
                            document_id=document.id,
                            field_label=label[:100],
                            extracted_value=value,
                            confidence=1.0,
                            readiness_dimension=dim_key,
                            confirmation_status="UNCONFIRMED"
                        )
                        db.add(field)
            
            document.upload_status = "COMPLETED"
            db.commit()
            
            # Trigger score recalculation
            ReadinessService.calculate_and_save_scores(db, document.household_id)
            
        except Exception:
            document.upload_status = "FAILED"
            db.commit()
