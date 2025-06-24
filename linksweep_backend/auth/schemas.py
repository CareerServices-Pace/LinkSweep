from pydantic import BaseModel, EmailStr

class SignupRequest(BaseModel):
    email: EmailStr
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

class PromoteRequest(BaseModel):
    user_id: int