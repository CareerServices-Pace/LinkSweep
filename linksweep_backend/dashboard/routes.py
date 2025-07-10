from fastapi import APIRouter, Depends, HTTPException
from db.connection import get_connection
from auth.dependencies import get_current_user
from datetime import datetime, timedelta, time

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@dashboard_router.get("/stats")
async def get_dashboard_stats():
    conn = await get_connection()

    today = datetime.utcnow()
    start_of_week_date = (today - timedelta(days=today.weekday())).date()  # Monday date
    start_of_week = datetime.combine(start_of_week_date, time.min)  # Sets time to 00:00:00

    # 1. Total broken links in the last scan (latest scan globally)
    last_scan = await conn.fetchrow(
        'SELECT "brokenLinks" FROM scan_runs ORDER BY "runStartedAt" DESC LIMIT 1'
    )
    broken_links_count = last_scan["brokenLinks"] if last_scan else 0

    # 2. Total scans this week (global count)
    scans_this_week = await conn.fetchval(
        'SELECT COUNT(*) FROM scan_runs WHERE "runStartedAt" >= $1', start_of_week
    )

    # 3. Total users (global)
    total_users = await conn.fetchval('SELECT COUNT(*) FROM users')

    await conn.close()

    print("broken_links_count:", broken_links_count)
    print("scans_this_week:", scans_this_week)
    print("start_of_week (UTC 00:00):", start_of_week)

    return {
        "broken_links_last_scan": broken_links_count,
        "scans_this_week": scans_this_week,
        "total_users": total_users
    }