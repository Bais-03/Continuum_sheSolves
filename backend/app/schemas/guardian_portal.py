from typing import Optional

from pydantic import BaseModel, EmailStr


class GuardianPortalResponse(BaseModel):
    guardian_id: str
    name: str
    relationship: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: str

    threshold: int
    total_guardians: int

    responsibility: str
    access_level: str