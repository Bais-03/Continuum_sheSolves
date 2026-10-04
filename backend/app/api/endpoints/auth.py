"""
auth.py — Auth endpoints
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.household import Household, HouseholdMember
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, UserOut
from app.services.auth_service import (
    create_access_token,
    generate_csrf_token,
    get_current_user,
    hash_password,
    verify_csrf_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, user_id: str) -> str:
    """Issue JWT + CSRF cookies and return the CSRF token."""
    access_token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    csrf_token = generate_csrf_token()

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    # CSRF cookie is readable by JS (no httponly) so the frontend can send it
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return csrf_token


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=settings.COOKIE_NAME, httponly=True, samesite=settings.COOKIE_SAMESITE)
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, samesite=settings.COOKIE_SAMESITE)


def _get_user_household_id(user: User, db: Session) -> str | None:
    hh = db.query(Household).filter(Household.owner_id == user.id).first()
    return hh.id if hh else None


# ---------------------------------------------------------------------------
# POST /auth/signup
# ---------------------------------------------------------------------------
@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)):
    email = body.email.strip().lower()

    # Duplicate email check
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
    )
    db.add(user)
    db.flush()  # get user.id before creating household

    # Create initial household named after the user
    household_name = f"{user.full_name.split()[0]}'s Household"
    household = Household(name=household_name, owner_id=user.id)
    db.add(household)
    db.flush()

    # Add user as the primary member
    member = HouseholdMember(
        household_id=household.id,
        name=user.full_name,
        role="Primary",
        email=user.email,
    )
    db.add(member)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    db.refresh(user)
    _set_auth_cookies(response, user.id)
    return UserOut(id=user.id, email=user.email, full_name=user.full_name, household_id=household.id)


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post("/login", response_model=UserOut)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Generic error to prevent user enumeration
    _INVALID = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )

    if not user or not verify_password(body.password, user.password_hash):
        raise _INVALID

    household_id = _get_user_household_id(user, db)
    _set_auth_cookies(response, user.id)
    return UserOut(id=user.id, email=user.email, full_name=user.full_name, household_id=household_id)


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------
@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    verify_csrf_token(request)
    _clear_auth_cookies(response)


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    household_id = _get_user_household_id(current_user, db)
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        household_id=household_id,
    )
