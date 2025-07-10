from fastapi import APIRouter, Depends, HTTPException, Response, Path
from db.connection import get_connection
from auth.dependencies import get_current_user
from utils.pdf_generator import generate_pdf_report
from utils.excel_generator import generate_excel_report
from typing import List, Optional
from datetime import datetime
from fastapi.responses import StreamingResponse

history_router = APIRouter(prefix="/history", tags=["History"])

# 1. Recent 5 Scans
@history_router.get("/recent")
async def get_recent_scans(user: dict = Depends(get_current_user)):
    conn = await get_connection()

    rows = await conn.fetch("""
        SELECT r."runID", r."scanID", s."startURL", r."totalLinks", r."brokenLinks", r."runStartedAt", r."runEndedAt"
        FROM scan_runs r
        JOIN scans s ON r."scanID" = s."scanID"
        ORDER BY r."runStartedAt" DESC
        LIMIT 5;
    """)
    await conn.close()
    return {"success": True, "data": [dict(row) for row in rows]}


# 2. Paginated Full History
@history_router.get("/all")
async def get_all_scan_runs(page: int = 1, page_size: int = 10):
    if page_size not in [5, 10, 25, 100]:
        raise HTTPException(status_code=400, detail="Invalid page size. Choose 5, 10, 25, or 100.")

    offset = (page - 1) * page_size
    conn = await get_connection()

    rows = await conn.fetch("""
        SELECT r."runID", r."scanID", s."startURL", r."totalLinks", r."brokenLinks", r."runStartedAt", r."runEndedAt"
        FROM scan_runs r
        JOIN scans s ON r."scanID" = s."scanID"
        ORDER BY r."runStartedAt" DESC
        OFFSET $1 LIMIT $2;
    """, offset, page_size)

    await conn.close()
    
    return {"success": True, "data": [dict(row) for row in rows]}

# 3. Full Results for a Scan
@history_router.get("/{run_id}/full")
async def get_full_scan_results(run_id: int = Path(..., description="Run ID to fetch")):
    conn = await get_connection()

    rows = await conn.fetch("""
        SELECT "source_page", "link", "status_code", "status_text", "link_type", "fixGuide"
        FROM linkresults
        WHERE "runID" = $1 AND ("status_code" IS NULL OR "status_code" >= 400)
        ORDER BY "checkedAt" ASC;
    """, run_id)

    await conn.close()
    return {"success": True, "data": [dict(row) for row in rows]}


# 4. Download PDF
@history_router.get("/{run_id}/download")
async def download_scan_pdf(run_id: int):
    conn = await get_connection()

    rows = await conn.fetch("""
        SELECT "source_page", "link", "status_code", "status_text", "link_type", "fixGuide"
        FROM linkresults
        WHERE "runID" = $1
        ORDER BY "checkedAt" ASC;
    """, run_id)

    await conn.close()

    results = []
    for row in rows:
        results.append({
            "sourcePage": row["source_page"],
            "link": row["link"],
            "statusCode": row["status_code"],
            "statusText": row["status_text"],
            "linkType": row["link_type"],
            "fixGuide": row["fixGuide"]
        })

    filename, file_stream = generate_excel_report(results, run_id)

    print(f"📦 Sending Excel file with filename: {filename}")

    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )