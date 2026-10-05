from pydantic import BaseModel, EmailStr, field_validator


class GuardianInvitationAcceptRequest(BaseModel):
    full_name: str
    password: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("full_name must not be blank")

        return value

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("password must be at least 8 characters")

        return value


class GuardianInvitationAcceptResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    guardian_id: str
    email: EmailStr
    full_name: str