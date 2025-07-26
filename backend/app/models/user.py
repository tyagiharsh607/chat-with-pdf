from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str | None = None  # optional, in case you want to store it later


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    user_id: str
    email: EmailStr
