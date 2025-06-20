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