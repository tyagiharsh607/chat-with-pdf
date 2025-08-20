from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str | None = None  # optional, in case you want to store it later


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class AuthResponse(BaseModel):
    access_token: Optional[str] = None  # Make optional
    refresh_token: Optional[str] = None  # Make optional
    user_id: str
    email: str
    message: str = "Authentication successful"  # Add message field
    requires_confirmation: bool = False 

class RefreshTokenRequest(BaseModel):
    refresh_token: str