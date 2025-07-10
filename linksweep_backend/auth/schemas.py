from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    email: EmailStr
    username: str
    firstName: str
    lastName: str
    role_id: int

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