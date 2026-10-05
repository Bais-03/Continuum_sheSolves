from pydantic import BaseModel, EmailStr
from typing import List, Optional


class GuardianInfo(BaseModel):
    id: str
    name: str
    relationship: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str


class GuardianCreateRequest(BaseModel):
    name: str
    relationship: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class GuardianUpdateRequest(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None


class GuardianConfigResponse(BaseModel):
    guardians: List[GuardianInfo]
    threshold: int
    total_guardians: int
    status: str


class GuardianReleaseRequest(BaseModel):
    guardian_ids: List[str]


class GuardianReleaseResponse(BaseModel):
    success: bool
    message: str
    released_by: List[str]
    threshold: int