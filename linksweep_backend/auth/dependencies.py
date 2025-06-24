from fastapi import Depends, HTTPException, status, Request
from jose import JWTError, jwt
from db.connection import get_connection
from auth.utils import SECRET_KEY, ALGORITHM
from typing import Optional

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token missing"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        role = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

    # Optional: Fetch user from DB for validation
    conn = await get_connection()
    user = await conn.fetchrow('SELECT * FROM users WHERE "UserID" = $1', int(user_id))
    await conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_dict = dict(user)
    user_dict["role"] = role
    return user_dict


async def admin_required(user=Depends(get_current_user)):
    if user.get("roleid") != 1:  # Assuming 1 is the RoleID for admin
        raise HTTPException(status_code=403, detail="Admin access required")
    return user