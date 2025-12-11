from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupRequest(BaseModel):
    email: EmailStr
    username: Optional[str] = None  # If not provided, will be set to firstName
    password: Optional[str] = None  # If provided, use it; otherwise generate random
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    role_id: Optional[int] = None  # If not provided, default to "user" role

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str

class PromoteRequest(BaseModel):
    user_id: int

class PasswordResetRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str
    token: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str