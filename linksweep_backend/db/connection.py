import asyncpg
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()


async def get_connection():
    # Get DB URL from environment or use a fallback
    db_url = os.getenv("DATABASE_URL")

    # Parse the URL
    parsed_url = urlparse(db_url)

    return await asyncpg.connect(
        user=parsed_url.username,
        password=parsed_url.password,
        database=parsed_url.path.lstrip("/"),  # remove leading '/'
        host=parsed_url.hostname,
        port=parsed_url.port
    )
