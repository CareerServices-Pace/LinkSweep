import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def get_connection():
    return await asyncpg.connect(
        user=os.getenv("DB_USER", "karandavda"),
        password=os.getenv("DB_PASS", "KRD@1721#Pace$"),
        database=os.getenv("DB_NAME", "linksweep"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432")
    )