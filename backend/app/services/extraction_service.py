import os
from sqlalchemy.orm import Session
from app.models.domain import Document, ExtractedField
from app.services.storage_service import StorageService

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
            return
            
        try:
            document.upload_status = "PROCESSING"
            db.commit()
            
            file_path = StorageService.get_file_path(document.storage_reference)
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Very basic deterministic extraction: Key: Value pairs per line
            lines = content.splitlines()
            for line in lines:
                if ":" in line:
                    parts = line.split(":", 1)
                    label = parts[0].strip()
                    value = parts[1].strip()
                    
                    if label and value:
                        field = ExtractedField(
                            document_id=document.id,
                            field_label=label[:100],
                            extracted_value=value,
                            confidence=1.0,
                            confirmation_status="UNCONFIRMED"
                        )
                        db.add(field)
            
            document.upload_status = "COMPLETED"
            db.commit()
            
        except Exception:
            document.upload_status = "FAILED"
            db.commit()
