import asyncio
from db.connection import get_connection

async def test_connection():
    try:
        conn = await get_connection()
        result = await conn.fetch("SELECT NOW();")
        print("✅ Connection successful!")
        print("🕒 Server time:", result[0]['now'])
        await conn.close()
    except Exception as e:
        print("❌ Connection failed:", e)

asyncio.run(test_connection())