from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GuardianReleaseCreateRequest(BaseModel):
    """Request from the primary household user to start a release."""

    reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional reason for initiating the release request.",
    )


class GuardianReleaseApprovalRequest(BaseModel):
    """Request from a Guardian to approve a release."""

    pass


class GuardianReleaseRejectionRequest(BaseModel):
    """Request from a Guardian to reject a release."""

    pass


class GuardianReleaseApprovalResponse(BaseModel):
    """Approval status for one Guardian."""

    guardian_id: str
    guardian_name: str
    status: str
    responded_at: Optional[datetime] = None


class GuardianReleaseRequestResponse(BaseModel):
    """Release request information visible to authorized users."""

    id: str
    status: str
    threshold: int

    approved_count: int
    rejected_count: int
    pending_count: int

    reason: Optional[str] = None

    created_at: datetime
    expires_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

    approvals: list[GuardianReleaseApprovalResponse] = []


class GuardianReleaseSummaryResponse(BaseModel):
    """Compact release status for dashboards."""

    id: str
    status: str
    threshold: int

    approved_count: int
    rejected_count: int
    pending_count: int

    created_at: datetime
    expires_at: Optional[datetime] = None