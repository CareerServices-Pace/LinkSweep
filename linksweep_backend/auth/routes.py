from fastapi import APIRouter, HTTPException, Response, Request, APIRouter, Depends, status, Body
from auth.schemas import SignupRequest, LoginRequest, TokenResponse, RefreshResponse, PromoteRequest, PasswordResetRequest, OTPVerifyRequest, ResetPasswordRequest, ChangePasswordRequest
from auth.utils import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from auth.dependencies import get_current_user, admin_required
from db.connection import get_connection
from dotenv import load_dotenv
import os
from jose import jwt, JWTError
from utils.security import generate_random_password
from utils.email_sender import send_email
from utils.otp_utils import generate_otp_token, verify_otp_token
from passlib.context import CryptContext
import secrets, hashlib, hmac, time
from db.connection import get_connection

# SECRET & ALGORITHM
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

OTP_SECRET_KEY = os.getenv("OTP_SECRET_KEY")    

auth_router = APIRouter(prefix="/auth", tags=["Auth"])

@auth_router.post("/signup")
async def signup(data: SignupRequest):
    conn = await get_connection()

    if not data.email.endswith("@pace.edu"):
        raise HTTPException(status_code=400, detail="Only @pace.edu emails are allowed")

    role_exists = await conn.fetchval('SELECT 1 FROM roles WHERE "RoleID" = $1', data.role_id)
    if not role_exists:
        raise HTTPException(status_code=400, detail="Invalid role ID")

    existing_user = await conn.fetchval('SELECT 1 FROM users WHERE email = $1', data.email)
    if existing_user:
        await conn.close()
        raise HTTPException(status_code=400, detail="User with this email already exists")

    raw_password = generate_random_password()
    hashed_password = hash_password(raw_password)

    await conn.execute("""
        INSERT INTO users (email, username, password, "RoleID", "firstName", "lastName", "createdAt", "modifiedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    """, data.email, data.username, hashed_password, data.role_id, data.firstName, data.lastName)

    await conn.close()

    # Prepare dynamic email content
    subject = "🎉 Welcome to LinkSweep - Your Login Credentials"
    plain_text = f"""
        Hello {data.username},

        Welcome to LinkSweep!

        Username: {data.username}
        Password: {raw_password}

        Please log in and change your password on first login.

        Regards,
        LinkSweep Team
    """
    html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); padding: 30px;">
                    <h2 style="color: #333333;">👋 Hello <span style="color: #4F46E5;">{data.username}</span>,</h2>
                    <p style="color: #555555; font-size: 16px;">Welcome to <strong>LinkSweep</strong>! Your account has been successfully created.</p>

                    <h3 style="color: #4F46E5; margin-top: 20px;">🔑 Login Credentials:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 8px; background-color: #f1f5f9; color: #333; border-radius: 4px;">Username:</td>
                            <td style="padding: 8px; color: #111;">{data.username}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; background-color: #f1f5f9; color: #333; border-radius: 4px;">Password:</td>
                            <td style="padding: 8px; color: #111;">{raw_password}</td>
                        </tr>
                    </table>

                    <p style="color: #555555; font-size: 15px; margin-top: 20px;">
                        👉 For security reasons, please <strong>log in and change your password</strong> immediately after your first login.
                    </p>

                    <p style="color: #555555; font-size: 15px; margin-top: 20px;">If you face any issues, feel free to contact our support team.</p>

                    <p style="color: #999999; font-size: 14px; margin-top: 30px;">Regards,<br><strong>LinkSweep Team</strong></p>
                </div>
            </body>
        </html>
    """

    send_email(data.email, subject, plain_text, html_content)

    return {"message": "User created successfully and email sent"}

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

    # ✅ Set BOTH tokens as httpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # ✅ For local dev. Change to True in production
        samesite="Strict"
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Strict"
    )

    return {
        "message": "Login successful",
        "role": user["RoleName"],
        "user": {
            "id": user["UserID"],
            "email": user["email"],
            "username": user["username"]
    }
}

@auth_router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        # Decode the refresh token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Check user in DB
        conn = await get_connection()
        user = await conn.fetchrow(
            'SELECT email, "RoleID" FROM users WHERE "UserID" = $1', int(user_id)
        )
        await conn.close()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Generate new access token
        new_access_token = create_access_token({
            "sub": str(user_id),
            "email": user["email"],
            "role": user["RoleID"]
        })

        # Set access token cookie (adjust secure and samesite for local dev)
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=False,        
            samesite="Lax",      
            max_age=1800         
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@auth_router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "userID": user["UserID"],
        "email": user["email"],
        "username": user["username"],
        "firstName": user["firstName"],
        "role": user["role"]
    }

@auth_router.get("/admins", dependencies=[Depends(admin_required)])
async def get_admin_users():
    conn = await get_connection()
    admins = await conn.fetch("""
        SELECT UserID, username, email 
        FROM users 
        WHERE roleid = (
            SELECT "RoleID" FROM roles WHERE "RoleName" = 'Admin'
        )
    """)
    await conn.close()
    return [dict(admin) for admin in admins]

@auth_router.get("/users", dependencies=[Depends(admin_required)])
async def get_all_users():
    conn = await get_connection()
    users = await conn.fetch("""
        SELECT 
            "UserID",
            "firstName",
            "lastName",
            "username",
            "email",
            (SELECT "RoleName" FROM roles WHERE roles."RoleID" = users."RoleID") AS role
        FROM users
        ORDER BY "firstName";
    """)
    await conn.close()

    # Format response with IsAdmin boolean
    return [
        {
            "id": user["UserID"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "username": user["username"],
            "email": user["email"],
            "isAdmin": user["role"].lower() == "admin" if user["role"] else False
        }
        for user in users
    ]

@auth_router.post("/promote", dependencies=[Depends(admin_required)])
async def toggle_admin_role(request: PromoteRequest):
    conn = await get_connection()

    admin_role_id = await conn.fetchval('SELECT "RoleID" FROM roles WHERE "RoleName" = $1', "Admin")
    if not admin_role_id:
        await conn.close()
        raise HTTPException(status_code=400, detail="Admin role not found")

    # Get current role of user
    current_role_id = await conn.fetchval('SELECT "RoleID" FROM users WHERE "UserID" = $1', request.user_id)
    if current_role_id is None:
        await conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    # Check target role
    new_role_id = None
    action = ""

    if current_role_id == admin_role_id:
        # Already Admin → Demote
        new_role_id = await conn.fetchval('SELECT "RoleID" FROM roles WHERE "RoleName" = $1', "User")
        action = "demoted to user"
    else:
        # Not Admin → Promote
        new_role_id = admin_role_id
        action = "promoted to admin"

    if new_role_id is None:
        await conn.close()
        raise HTTPException(status_code=400, detail="Target role not found")

    # Update role
    await conn.execute(
        'UPDATE users SET "RoleID" = $1, "modifiedAt" = NOW() WHERE "UserID" = $2',
        new_role_id, request.user_id
    )

    await conn.close()
    return {"message": f"User {action} successfully"}

@auth_router.get("/roles")
async def get_roles():
    conn = await get_connection()
    rows = await conn.fetch('SELECT "RoleID", "RoleName" FROM roles ORDER BY "RoleID"')
    await conn.close()
    return  [
        {"id": row["RoleID"], "name": row["RoleName"]}
        for row in rows
    ]

@auth_router.post("/request-reset")
async def request_password_reset(data: PasswordResetRequest):
    email = data.email

    conn = await get_connection()

    user = await conn.fetchrow('SELECT * FROM users WHERE email = $1', email)
    if not user:
        raise HTTPException(status_code=404, detail="No user found with that email.")

    otp = str(secrets.randbelow(1000000)).zfill(6)
    token = generate_otp_token(email, otp)

    subject = "🔐 LinkSweep Password Reset OTP"
    plain_text = f"""
        Hi,

        You requested a password reset for your LinkSweep account.
        Use the following OTP to reset your password:

        OTP: {otp}

        This OTP will expire in 10 minutes.

        If you didn’t request this, please ignore this email.
    """
    html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                <h2 style="color: #4F46E5;">🔐 Password Reset Request</h2>
                <p>Hi there,</p>
                <p>Someone requested a password reset for your LinkSweep account.</p>
                <h3 style="background: #e2e8f0; padding: 10px; border-radius: 6px;">OTP: <strong>{otp}</strong></h3>
                <p>This OTP is valid for <strong>10 minutes</strong>. If you didn’t request this, you can ignore this email.</p>
                <p style="color: #999; margin-top: 30px;">– LinkSweep Team</p>
            </div>
            </body>
        </html>
    """
    send_email(email, subject, plain_text, html_content)

    await conn.close()
    return {"token": token}

@auth_router.post("/verify-otp")
async def verify_otp(data: OTPVerifyRequest):
    try:
        email = verify_otp_token(data.token, data.email, data.otp)
        return {
            "success": True,
            "message": "OTP verified successfully.",
            "email": email
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@auth_router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        payload = decode_otp_token(data.token)
        print("payload: ", payload)
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid token. Cannot reset password.")

        hashed_password = hash_password(data.new_password)

        conn = await get_connection()
        await conn.execute('UPDATE users SET password = $1 WHERE email = $2', hashed_password, email)
        await conn.close()

        return {
            "success": True,
            "message": "Password reset successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/change-password")
async def change_password(data: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    try:
        conn = await get_connection()
        user_record = await conn.fetchrow('SELECT password FROM users WHERE "UserID" = $1', user["UserID"])

        if not user_record or not verify_password(data.current_password, user_record["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

        hashed_new_password = hash_password(data.new_password)

        await conn.execute('UPDATE users SET password = $1 WHERE "UserID" = $2', hashed_new_password, user["UserID"])
        await conn.close()

        return {
            "success": True,
            "message": "Password changed successfully."
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def decode_otp_token(token: str) -> dict:
    try:
        parts = token.split(':')
        if len(parts) != 4:
            raise Exception("Invalid token format.")

        email, otp, expiry_str, signature = parts
        expiry = int(expiry_str)

        if time.time() > expiry:
            raise Exception("Token has expired.")

        expected_signature = hmac.new(
            OTP_SECRET_KEY.encode(),
            f"{email}:{otp}:{expiry}".encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_signature):
            raise Exception("Invalid token signature.")

        return {
            "email": email,
            "otp": otp,
            "exp": expiry
        }

    except Exception as e:
        raise Exception(f"Invalid or expired token. Details: {str(e)}")
