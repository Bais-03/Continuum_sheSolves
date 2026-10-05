from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class GuardianInvitationResponse(BaseModel):
    invitation_id: str
    guardian_id: str
    invited_email: Optional[EmailStr] = None
    status: str
    expires_at: datetime
    invitation_link: str


class GuardianInvitationValidationResponse(BaseModel):
    valid: bool
    guardian_id: Optional[str] = None
    guardian_name: Optional[str] = None
    invited_email: Optional[EmailStr] = None
    expires_at: Optional[datetime] = None
    message: str


class GuardianInvitationRevokeResponse(BaseModel):
    success: bool
    message: str