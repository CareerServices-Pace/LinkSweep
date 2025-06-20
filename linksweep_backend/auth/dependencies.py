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
        user_id: Optional[int] = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

    # Optional: Fetch user from DB for additional checks
    conn = await get_connection()
    user = await conn.fetchrow('SELECT * FROM users WHERE "userID" = $1', user_id)
    await conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return dict(user)