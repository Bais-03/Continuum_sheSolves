from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_household,
    get_current_user,
    verify_csrf,
)
from app.db.session import get_db
from app.models.guardian import Guardian
from app.models.guardian_release import GuardianReleaseApproval
from app.models.household import Household
from app.models.user import User

from app.schemas.guardian import (
    GuardianConfigResponse,
    GuardianCreateRequest,
    GuardianInfo,
    GuardianReleaseRequest,
    GuardianReleaseResponse,
    GuardianUpdateRequest,
)

from app.schemas.guardian_invitation import (
    GuardianInvitationResponse,
    GuardianInvitationRevokeResponse,
    GuardianInvitationValidationResponse,
)

from app.schemas.guardian_release import (
    GuardianReleaseApprovalRequest,
    GuardianReleaseApprovalResponse,
    GuardianReleaseCreateRequest,
    GuardianReleaseRejectionRequest,
    GuardianReleaseRequestResponse,
    GuardianReleaseSummaryResponse,
)

from app.services.guardian_invitation_service import (
    create_guardian_invitation,
    get_invitation_by_token,
    revoke_guardian_invitation,
)

from app.services.guardian_service import (
    create_guardian,
    delete_guardian,
    get_guardian_config,
    release_guardian_vault,
    update_guardian,
)

from app.services.guardian_release_service import (
    approve_release_request,
    count_approvals,
    create_release_request,
    get_guardian_pending_requests,
    get_household_release_requests,
    get_release_request,
    reject_release_request,
)


router = APIRouter(
    prefix="/guardian",
    tags=["Guardian"],
)


# ============================================================================
# Guardian Management
# ============================================================================


@router.get(
    "",
    response_model=GuardianConfigResponse,
)
def get_guardians(
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianConfigResponse:
    """
    Return Guardian configuration for the authenticated user's household.
    """

    return get_guardian_config(
        db=db,
        household_id=household.id,
    )


@router.post(
    "",
    response_model=GuardianInfo,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def add_guardian(
    request: GuardianCreateRequest,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianInfo:
    """
    Create a Guardian for the authenticated user's household.
    """

    return create_guardian(
        db=db,
        household_id=household.id,
        request=request,
    )


@router.patch(
    "/{guardian_id}",
    response_model=GuardianInfo,
    dependencies=[Depends(verify_csrf)],
)
def edit_guardian(
    guardian_id: str,
    request: GuardianUpdateRequest,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianInfo:
    """
    Update a Guardian belonging to the authenticated user's household.
    """

    guardian = update_guardian(
        db=db,
        household_id=household.id,
        guardian_id=guardian_id,
        request=request,
    )

    if guardian is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian not found.",
        )

    return guardian


@router.delete(
    "/{guardian_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verify_csrf)],
)
def remove_guardian(
    guardian_id: str,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> None:
    """
    Delete a Guardian belonging to the authenticated user's household.
    """

    deleted = delete_guardian(
        db=db,
        household_id=household.id,
        guardian_id=guardian_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian not found.",
        )


# ============================================================================
# Guardian Invitations
# ============================================================================


@router.post(
    "/{guardian_id}/invite",
    response_model=GuardianInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def invite_guardian(
    guardian_id: str,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianInvitationResponse:
    """
    Create a secure invitation for a Guardian.

    The invitation is scoped to the authenticated user's household.
    """

    try:
        invitation, raw_token = create_guardian_invitation(
            db=db,
            household_id=household.id,
            guardian_id=guardian_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    invitation_link = (
        f"http://localhost:8080/guardian/invite/{raw_token}"
    )

    return GuardianInvitationResponse(
        invitation_id=invitation.id,
        guardian_id=invitation.guardian_id,
        invited_email=invitation.invited_email,
        status=invitation.status,
        expires_at=invitation.expires_at,
        invitation_link=invitation_link,
    )


@router.get(
    "/invitation/{token}",
    response_model=GuardianInvitationValidationResponse,
)
def validate_guardian_invitation(
    token: str,
    db: Session = Depends(get_db),
) -> GuardianInvitationValidationResponse:
    """
    Validate a Guardian invitation token.

    This endpoint does not require authentication because the Guardian
    may not have an account yet.
    """

    invitation = get_invitation_by_token(
        db=db,
        raw_token=token,
    )

    if invitation is None:
        return GuardianInvitationValidationResponse(
            valid=False,
            message=(
                "This invitation is invalid, expired, revoked, "
                "or already accepted."
            ),
        )

    guardian = db.get(
        Guardian,
        invitation.guardian_id,
    )

    if guardian is None:
        return GuardianInvitationValidationResponse(
            valid=False,
            message="Guardian record no longer exists.",
        )

    return GuardianInvitationValidationResponse(
        valid=True,
        guardian_id=guardian.id,
        guardian_name=guardian.name,
        invited_email=invitation.invited_email,
        expires_at=invitation.expires_at,
        message="Guardian invitation is valid.",
    )


@router.post(
    "/invitation/{invitation_id}/revoke",
    response_model=GuardianInvitationRevokeResponse,
    dependencies=[Depends(verify_csrf)],
)
def revoke_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianInvitationRevokeResponse:
    """
    Revoke a pending Guardian invitation.

    Only the household owner can revoke the invitation.
    """

    revoked = revoke_guardian_invitation(
        db=db,
        household_id=household.id,
        invitation_id=invitation_id,
    )

    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending invitation not found.",
        )

    return GuardianInvitationRevokeResponse(
        success=True,
        message="Guardian invitation revoked successfully.",
    )


# ============================================================================
# Guardian Release Requests - Household User
# ============================================================================


@router.post(
    "/release-requests",
    response_model=GuardianReleaseRequestResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def create_guardian_release_request(
    request: GuardianReleaseCreateRequest,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
    current_user: User = Depends(get_current_user),
) -> GuardianReleaseRequestResponse:
    """
    Start a new Guardian release request.

    Only the authenticated household user can initiate the request.
    """

    try:
        release_request = create_release_request(
            db=db,
            household_id=household.id,
            initiated_by=current_user.id,
            reason=request.reason,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    stats = count_approvals(
        db=db,
        release_request_id=release_request.id,
    )

    return GuardianReleaseRequestResponse(
        id=release_request.id,
        status=release_request.status,
        threshold=release_request.threshold,
        approved_count=stats["approved"],
        rejected_count=stats["rejected"],
        pending_count=stats["pending"],
        reason=release_request.reason,
        created_at=release_request.created_at,
        expires_at=release_request.expires_at,
        released_at=release_request.released_at,
        approvals=[],
    )


@router.get(
    "/release-requests",
    response_model=list[GuardianReleaseSummaryResponse],
)
def list_guardian_release_requests(
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> list[GuardianReleaseSummaryResponse]:
    """
    Return release requests belonging to the authenticated household.
    """

    requests = get_household_release_requests(
        db=db,
        household_id=household.id,
    )

    result: list[GuardianReleaseSummaryResponse] = []

    for release_request in requests:
        stats = count_approvals(
            db=db,
            release_request_id=release_request.id,
        )

        result.append(
            GuardianReleaseSummaryResponse(
                id=release_request.id,
                status=release_request.status,
                threshold=release_request.threshold,
                approved_count=stats["approved"],
                rejected_count=stats["rejected"],
                pending_count=stats["pending"],
                created_at=release_request.created_at,
                expires_at=release_request.expires_at,
            )
        )

    return result


# ============================================================================
# Guardian-side Release Requests
#
# IMPORTANT:
# /release-requests/pending MUST be registered before
# /release-requests/{release_request_id}
# so "pending" is not interpreted as a request ID.
# ============================================================================


def _get_authenticated_guardian(
    db: Session,
    current_user: User,
) -> Guardian:
    """
    Resolve the authenticated user to an active Guardian account.
    """

    guardian = (
        db.query(Guardian)
        .filter(
            Guardian.user_id == current_user.id,
            Guardian.status == "active",
        )
        .first()
    )

    if guardian is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active Guardian account required.",
        )

    return guardian


@router.get(
    "/release-requests/pending",
    response_model=list[GuardianReleaseSummaryResponse],
)
def get_pending_guardian_release_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GuardianReleaseSummaryResponse]:
    """
    Return pending release requests assigned to the authenticated Guardian.
    """

    guardian = _get_authenticated_guardian(
        db=db,
        current_user=current_user,
    )

    requests = get_guardian_pending_requests(
        db=db,
        guardian_id=guardian.id,
    )

    result: list[GuardianReleaseSummaryResponse] = []

    for release_request in requests:
        stats = count_approvals(
            db=db,
            release_request_id=release_request.id,
        )

        result.append(
            GuardianReleaseSummaryResponse(
                id=release_request.id,
                status=release_request.status,
                threshold=release_request.threshold,
                approved_count=stats["approved"],
                rejected_count=stats["rejected"],
                pending_count=stats["pending"],
                created_at=release_request.created_at,
                expires_at=release_request.expires_at,
            )
        )

    return result


@router.get(
    "/release-requests/{release_request_id}",
    response_model=GuardianReleaseRequestResponse,
)
def get_guardian_release_request(
    release_request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GuardianReleaseRequestResponse:
    """
    Return one release request that the authenticated user is authorized to see.

    Household users can view requests belonging to their household.

    Guardians can view only release requests for which they have an
    assigned Guardian approval record.
    """

    release_request = get_release_request(
        db=db,
        release_request_id=release_request_id,
    )

    if release_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release request not found.",
        )

    # ------------------------------------------------------------------
    # Authorization
    # ------------------------------------------------------------------
    # Check whether the authenticated user owns a household containing
    # this release request.
    household = (
        db.query(Household)
        .filter(
            Household.owner_id == current_user.id,
        )
        .first()
    )

    is_authorized_household_user = (
        household is not None
        and release_request.household_id == household.id
    )

    # If the user is not the household owner, check whether the user is
    # an active Guardian assigned to this specific release request.
    is_authorized_guardian = False

    if not is_authorized_household_user:
        guardian = (
            db.query(Guardian)
            .filter(
                Guardian.user_id == current_user.id,
                Guardian.status == "active",
            )
            .first()
        )

        if guardian is not None:
            approval = (
                db.query(GuardianReleaseApproval)
                .filter(
                    GuardianReleaseApproval.release_request_id
                    == release_request.id,
                    GuardianReleaseApproval.guardian_id == guardian.id,
                )
                .first()
            )

            is_authorized_guardian = approval is not None

    if not is_authorized_household_user and not is_authorized_guardian:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this release request.",
        )

    # ------------------------------------------------------------------
    # Build response
    # ------------------------------------------------------------------

    stats = count_approvals(
        db=db,
        release_request_id=release_request.id,
    )

    approvals: list[GuardianReleaseApprovalResponse] = []

    for approval in release_request.approvals:
        guardian = db.get(
            Guardian,
            approval.guardian_id,
        )

        if guardian is None:
            continue

        approvals.append(
            GuardianReleaseApprovalResponse(
                guardian_id=guardian.id,
                guardian_name=guardian.name,
                status=approval.status,
                responded_at=approval.responded_at,
            )
        )

    return GuardianReleaseRequestResponse(
        id=release_request.id,
        status=release_request.status,
        threshold=release_request.threshold,
        approved_count=stats["approved"],
        rejected_count=stats["rejected"],
        pending_count=stats["pending"],
        reason=release_request.reason,
        created_at=release_request.created_at,
        expires_at=release_request.expires_at,
        released_at=release_request.released_at,
        approvals=approvals,
    )


@router.post(
    "/release-requests/{release_request_id}/approve",
    response_model=GuardianReleaseRequestResponse,
    dependencies=[Depends(verify_csrf)],
)
def approve_guardian_release_request(
    release_request_id: str,
    request: GuardianReleaseApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GuardianReleaseRequestResponse:
    """
    Approve a release request as the authenticated Guardian.
    """

    # The request body is intentionally empty.
    # Guardian identity comes from the authenticated session.
    _ = request

    guardian = _get_authenticated_guardian(
        db=db,
        current_user=current_user,
    )

    try:
        release_request = approve_release_request(
            db=db,
            release_request_id=release_request_id,
            guardian_id=guardian.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    stats = count_approvals(
        db=db,
        release_request_id=release_request.id,
    )

    return GuardianReleaseRequestResponse(
        id=release_request.id,
        status=release_request.status,
        threshold=release_request.threshold,
        approved_count=stats["approved"],
        rejected_count=stats["rejected"],
        pending_count=stats["pending"],
        reason=release_request.reason,
        created_at=release_request.created_at,
        expires_at=release_request.expires_at,
        released_at=release_request.released_at,
        approvals=[],
    )


@router.post(
    "/release-requests/{release_request_id}/reject",
    response_model=GuardianReleaseRequestResponse,
    dependencies=[Depends(verify_csrf)],
)
def reject_guardian_release_request(
    release_request_id: str,
    request: GuardianReleaseRejectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GuardianReleaseRequestResponse:
    """
    Reject a release request as the authenticated Guardian.
    """

    # The request body is intentionally empty.
    # Guardian identity comes from the authenticated session.
    _ = request

    guardian = _get_authenticated_guardian(
        db=db,
        current_user=current_user,
    )

    try:
        release_request = reject_release_request(
            db=db,
            release_request_id=release_request_id,
            guardian_id=guardian.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    stats = count_approvals(
        db=db,
        release_request_id=release_request.id,
    )

    return GuardianReleaseRequestResponse(
        id=release_request.id,
        status=release_request.status,
        threshold=release_request.threshold,
        approved_count=stats["approved"],
        rejected_count=stats["rejected"],
        pending_count=stats["pending"],
        reason=release_request.reason,
        created_at=release_request.created_at,
        expires_at=release_request.expires_at,
        released_at=release_request.released_at,
        approvals=[],
    )


# ============================================================================
# Legacy / Simulated Guardian Vault Release
# ============================================================================


@router.post(
    "/release",
    response_model=GuardianReleaseResponse,
    dependencies=[Depends(verify_csrf)],
)
def release_vault(
    request: GuardianReleaseRequest,
    db: Session = Depends(get_db),
    household: Household = Depends(get_current_household),
) -> GuardianReleaseResponse:
    """
    Validate selected Guardians and simulate vault release.

    Kept for backward compatibility with the existing Guardian release UI.
    """

    return release_guardian_vault(
        db=db,
        household_id=household.id,
        request=request,
    )