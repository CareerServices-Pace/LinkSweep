from fastapi import APIRouter, HTTPException, Response, Request, APIRouter, Depends
from auth.schemas import SignupRequest, LoginRequest, TokenResponse, RefreshResponse
from auth.utils import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from auth.dependencies import get_current_user, admin_required
from db.connection import get_connection
from dotenv import load_dotenv
import os
from jose import jwt, JWTError
from utils.security import generate_random_password
from utils.email_sender import send_credentials_email

# SECRET & ALGORITHM
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/signup")
async def signup(data: SignupRequest, user=Depends(admin_required)):
    conn = await get_connection()

    #validate @pace.edu domain emails only
    if not data.email.endswith("@pace.edu"):
        raise HTTPException(status_code=400, detail="Only @pace.edu emails are allowed")


    # Validate role exists
    role = await conn.fetchrow("SELECT * FROM roles WHERE RoleID = $1", data.role_id)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role ID")

    # Check if user already exists
    existing = await conn.fetchval("SELECT 1 FROM users WHERE email = $1", data.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # Generate random password
    raw_password = generate_random_password()  # You can implement this
    hashed_password = hash_password(raw_password)

    # Genrate Username from Email
    username = data.email.split("@")[0]

    await conn.execute("""
        INSERT INTO users (email, username, password, roleid, createdat, modifiedat)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
    """, data.email, username, hashed_password, data.role_id)

    await conn.close()

    send_credentials_email(
        to_email=data.email,
        username=username,
        password=raw_password
    )

    return {"message": "User created and email sent"}

@auth_router.post("/login")
async def login(data: LoginRequest, response: Response):
    conn = await get_connection()
    user = await conn.fetchrow("""
        SELECT users."UserID", users.email, users.username, users.password, roles."RoleName"
        FROM users
        JOIN roles ON users."RoleID" = roles."RoleID"
        WHERE users.email = $1
    """, data.email)
    await conn.close()

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({
        "sub": str(user["UserID"]),
        "email": user["email"],
        "role": user["RoleName"]
    })

    refresh_token = create_refresh_token({
        "sub": str(user["UserID"])
    })

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["RoleName"]
    }


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
    

@auth_router.get("/admins", dependencies=[Depends(admin_required)])
async def get_admin_users():
    conn = await get_connection()
    admins = await conn.fetch("""
        SELECT userID, username, email 
        FROM users 
        WHERE roleid = (
            SELECT "RoleID" FROM roles WHERE "RoleName" = 'Admin'
        )
    """)
    await conn.close()
    return [dict(admin) for admin in admins]


@auth_router.post("/promote", dependencies=[Depends(admin_required)])
async def promote_user(request: PromoteRequest):
    conn = await get_connection()

    admin_role_id = await conn.fetchval('SELECT "RoleID" FROM roles WHERE "RoleName" = $1', "Admin")
    if not admin_role_id:
        raise HTTPException(status_code=400, detail="Admin role not found")

    await conn.execute(
        'UPDATE users SET roleid = $1, modifiedat = NOW() WHERE "userID" = $2',
        admin_role_id, request.user_id
    )
    await conn.close()

    return {"message": "User promoted to admin"}