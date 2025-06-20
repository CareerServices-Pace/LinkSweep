from fastapi import APIRouter, HTTPException, Response, Request, APIRouter, Depends
from auth.schemas import SignupRequest, LoginRequest, TokenResponse, RefreshResponse
from auth.utils import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from auth.dependencies import get_current_user
from db.connection import get_connection
from dotenv import load_dotenv
import os
from jose import jwt, JWTError

# SECRET & ALGORITHM
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/signup")
async def signup(data: SignupRequest):
    conn = await get_connection()
    existing = await conn.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    hashed_pw = hash_password(data.password)
    await conn.execute("INSERT INTO users (email, password) VALUES ($1, $2)", data.email, hashed_pw)
    await conn.close()
    return {"message": "Signup successful"}

@auth_router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, response: Response):
    conn = await get_connection()
    user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", data.email)
    await conn.close()

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user["UserID"])})
    refresh_token = create_refresh_token({"sub": str(user["UserID"])})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    return {"access_token": access_token}

@auth_router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=403, detail="No refresh token")

    payload = decode_token(refresh_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=403, detail="Invalid or expired refresh token")

    new_access_token = create_access_token({"sub": payload["sub"]})
    return {"access_token": new_access_token}

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@auth_router.get("/me")
async def get_me(user=Depends(get_current_user)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")