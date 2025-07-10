import secrets
import hmac
import hashlib
import time
from typing import Tuple
import os

SECRET_KEY = os.getenv("OTP_SECRET_KEY").encode()

def generate_otp_token(email: str, otp: str, expiry_minutes: int = 5) -> str:
    expiry = int(time.time()) + (expiry_minutes * 60)
    data = f"{email}:{otp}:{expiry}"
    signature = hmac.new(SECRET_KEY, data.encode(), hashlib.sha256).hexdigest()
    return f"{data}:{signature}"


def verify_otp_token(token: str, email: str, otp: str) -> str:
    try:
        parts = token.split(':')
        if len(parts) != 4:
            raise ValueError("Invalid token format")

        token_email, token_otp, token_expiry, token_signature = parts

        if token_email != email or token_otp != otp:
            raise ValueError("OTP or email mismatch")

        if int(token_expiry) < int(time.time()):
            raise ValueError("OTP has expired")

        expected_signature = hmac.new(
            SECRET_KEY, f"{token_email}:{token_otp}:{token_expiry}".encode(), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(token_signature, expected_signature):
            raise ValueError("Token signature mismatch")

        return token_email
    except Exception as e:
        raise ValueError(str(e))


def generate_otp(length: int = 6) -> str:
    return ''.join(secrets.choice("0123456789") for _ in range(length))