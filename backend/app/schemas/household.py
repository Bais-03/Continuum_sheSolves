from typing import List, Optional
from pydantic import BaseModel


class MemberOut(BaseModel):
    id: str
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


class HouseholdOut(BaseModel):
    id: str
    name: str
    owner_id: str
    members: List[MemberOut] = []

    model_config = {"from_attributes": True}
