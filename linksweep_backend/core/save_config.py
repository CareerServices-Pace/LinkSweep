import json
from datetime import datetime
from typing import Dict
from db.connection import get_connection

async def save_config(userID: int, config: Dict) -> int:
    conn = await get_connection()
    try:
        timestamp = datetime.utcnow()
        startURL = config.get("startURL")

        query = """
        INSERT INTO scans ("userID", "startURL", "config", "createdAt", "modifiedAt")
        VALUES ($1, $2, $3, $4, $4)
        RETURNING "scanID";
        """
        row = await conn.fetchrow(query, userID, startURL, json.dumps(config), timestamp)
        await conn.close()
        return row["scanID"]
    except Exception as e:
        await conn.close()
        raise e


async def update_config(userID: int, scanID: int, config: Dict):
    conn = await get_connection()
    try:
        timestamp = datetime.utcnow()
        startURL = config.get("startURL")

        result = await conn.execute("""
            UPDATE scans
            SET "startURL" = $1,
                config = $2,
                "modifiedAt" = $3
            WHERE "scanID" = $4 AND "userID" = $5
        """, startURL, json.dumps(config), timestamp, scanID, userID)

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Configuration not found or not owned by user")
    finally:
        await conn.close()

