import asyncio
from db.connection import get_connection
from core.crawler import start_crawl
from typing import Dict, List
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from utils.pdf_generator import generate_pdf_report
from utils.excel_generator import generate_excel_report
import os, time

os.environ["TZ"] = "America/New_York"
time.tzset()

async def run_scan(userID: int, scanID: int) -> Dict:
    conn = await get_connection()

    #Use New York timezone
    runStartedAt = datetime.now(ZoneInfo("America/New_York"))
    runStartedAt_naive = runStartedAt.replace(tzinfo=None)

    try:
        print(f"Loading config for scanID: {scanID}")
        row = await conn.fetchrow(
            'SELECT "config", "startURL" FROM scans WHERE "scanID" = $1',
            scanID
        )
        if not row:
            raise ValueError("Invalid scanID or unauthorized access.")
        
        config = row["config"]

        #Convert config string to dict if needed
        if isinstance(config, str):
            config = json.loads(config)
 
        startURL = row["startURL"]
        max_depth = config.get("maxDepth", 2)
        timeout = config.get("timeout", 5)
        excludePaths = config.get("excludePaths", [])

        #Fix: Handle string excludePaths
        if isinstance(excludePaths, str):
            excludePaths = [path.strip() for path in excludePaths.split(",") if path.strip()]

        print("🚀 Crawling started...")
        print(f"StartURL: {startURL}, Max Depth: {max_depth}, Timeout: {timeout}, Exclude Paths: {excludePaths}")
        print(f"Run Started At: ", runStartedAt)

        results = await start_crawl(startURL, max_depth, timeout, excludePaths)
       
        print(f"Crawl finished. Total links found: {len(results)}")
        print(f"Run Started At: ", runStartedAt)

        runEndedAt = datetime.now(ZoneInfo("America/New_York"))
        runEndedAt_naive = runEndedAt.replace(tzinfo=None)

        print(f"Run Ended At: ", runEndedAt)

        total_links = len(results)
        broken_links = len([r for r in results if r['statusCode'] is None or r['statusCode'] >= 400])

        # Insert into scan_runs
        run_row = await conn.fetchrow("""
            INSERT INTO scan_runs (
                "scanID", "totalLinks", "brokenLinks",
                "runStartedAt", "runEndedAt", "createdAt", "modifiedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $6)
            RETURNING "runID";
        """, scanID, total_links, broken_links, runStartedAt_naive, runEndedAt_naive, runEndedAt_naive)

        runID = run_row["runID"]

        # Insert linkresults
        insert_link_query = """
        INSERT INTO linkresults (
            "runID", "scanID", "source_page", "link", "status_code",
            "status_text", "link_type", "checkedAt", "modifiedAt", "diagnosis", "redirectedToLogin", "fixGuide"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11);
        """

        for result in results:
            status_code = result["statusCode"]
            link = result["link"]
            text = result["statusText"]

            # Terminal output (Colored)
            if status_code is None or status_code >= 400:
                print(f'\033[91m{link} ({status_code} {text})\033[0m')
            else:
                print(f'\033[92m{link} ({status_code} {text})\033[0m')

            await conn.execute(
                insert_link_query,
                runID,
                scanID,
                result["sourcePage"],
                link,
                status_code,
                text,
                result["linkType"],
                runEndedAt_naive,
                result.get("diagnosis", ""),
                result.get("redirectedToLogin", False),
                result.get("fixGuide", ""),
            )

        #Generate PDF
        generate_excel_report(scanID, results)

        await conn.close()

        return {
            "scanID": scanID,
            "runID": runID,
            "totalLinks": total_links,
            "brokenLinks": broken_links
        }

    except Exception as e:
        await conn.close()
        print(f"Error during scan: {e}")
        raise e