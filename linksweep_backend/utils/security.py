import secrets
import string

def generate_random_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(chars) for _ in range(length))