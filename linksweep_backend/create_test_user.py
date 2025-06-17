import asyncio
from db.connection import get_connection

async def create_test_user():
    conn = await get_connection()
    try:
        insert = """
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING userID;
        """
        row = await conn.fetchrow(insert, "test@example.com", "fakehash123")
        print("✅ User created with ID:", row['userID'])
        await conn.close()
    except Exception as e:
        print("❌ Failed to insert test user:", e)

if __name__ == "__main__":
    asyncio.run(create_test_user())