import asyncio
from db.connection import get_connection
from core.crawler import start_crawl
from typing import Dict, List
import json
from datetime import datetime
from utils.pdf_generator import generate_pdf_report

async def run_scan(userID: int, scanID: int) -> Dict:
    conn = await get_connection()
    try:
        runTimestamp = datetime.utcnow()

        print(f"📄 Loading config for scanID: {scanID}")
        row = await conn.fetchrow(
            'SELECT "config", "startURL" FROM scans WHERE "scanID" = $1 AND "userID" = $2',
            scanID, userID
        )
        if not row:
            raise ValueError("❌ Invalid scanID or unauthorized access.")
        
        config = row["config"]
        startURL = row["startURL"]
        max_depth = config.get("maxDepth", 2)
        timeout = config.get("timeout", 5)
        excludePaths = config.get("excludePaths", [])

        print("🚀 Crawling started...")
        results = await start_crawl(startURL, max_depth, timeout, excludePaths)

        insert_query = """
        INSERT INTO linkresults (
            "scanID", "source_page", "link", "status_code",
            "status_text", "link_type", "checkedAt", "modifiedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7);
        """

        for result in results:
            status_code = result["statusCode"]
            link = result["link"]
            text = result["statusText"]

            # Terminal print with colors
            if status_code is None or status_code >= 400:
                print(f'\033[91m❌ {link} ({status_code} {text})\033[0m')
            else:
                print(f'\033[92m✅ {link} ({status_code} {text})\033[0m')

            await conn.execute(
                insert_query,
                scanID,
                result["sourcePage"],
                link,
                status_code,
                text,
                result["linkType"],
                runTimestamp
            )

        generate_pdf_report(scanID, results)
        await conn.close()

        return {
            "scanID": scanID,
            "totalLinks": len(results),
            "brokenLinks": len([r for r in results if r['statusCode'] is None or r['statusCode'] >= 400])
        }

    except Exception as e:
        await conn.close()
        print(f"❌ Error during scan: {e}")
        raise e