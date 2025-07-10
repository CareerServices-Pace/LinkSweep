from fastapi import APIRouter, HTTPException, Path, Depends
from db.connection import get_connection
from pydantic import BaseModel, Field
from typing import Dict, Any
from core.save_config import save_config, update_config
from auth.dependencies import get_current_user 
from core.scan_runner import run_scan
import json

router = APIRouter(
    prefix="/config",
    tags=["Scan Configuration"]
)

@router.get("/", summary="Get all saved scan configurations")
async def get_all_scan_configs():
    conn = await get_connection()
    try:
        records = await conn.fetch("""
            SELECT "scanID", "userID", "startURL", config, "createdAt", "modifiedAt"
            FROM scans
            ORDER BY "createdAt" DESC;
        """)

        configs = []
        for record in records:
            config_data = record["config"]
            # If config is string, parse it
            if isinstance(config_data, str):
                config_data = json.loads(config_data)

            configs.append({
                "scanID": record["scanID"],
                "startURL": record["startURL"],
                "config": config_data,
                "createdAt": record["createdAt"].isoformat(),
                "modifiedAt": record["modifiedAt"].isoformat() if record["modifiedAt"] else None,
            })

        return {"success": True, "data": configs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching configurations: {str(e)}")
    finally:
        await conn.close()

@router.get("/{scan_id}", summary="Get scan configuration by scanID")
async def get_scan_config_by_id(scan_id: int = Path(..., description="Scan ID to fetch")):
    conn = await get_connection()
    try:
        record = await conn.fetchrow("""
            SELECT "scanID", "userID", "startURL", "config", "createdAt", "modifiedAt"
            FROM scans
            WHERE "scanID" = $1;
        """, scan_id)

        if not record:
            raise HTTPException(status_code=404, detail=f"No configuration found for scanID {scan_id}")

        config_data = record["config"]
        if isinstance(config_data, str):
            config_data = json.loads(config_data)

        result = {
            "scanID": record["scanID"],
            "startURL": record["startURL"],
            "config": config_data,
            "createdAt": record["createdAt"].isoformat(),
            "modifiedAt": record["modifiedAt"].isoformat() if record["modifiedAt"] else None,
        }

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scan configuration: {str(e)}")
    finally:
        await conn.close()

class SaveConfigRequest(BaseModel):
    config: Dict[str, Any] = Field(..., description="Scan configuration JSON object (must include startURL)")

@router.post("/save")
async def save_scan_config(
    request: SaveConfigRequest,
    user: dict = Depends(get_current_user)
):
    try:
        scan_id = await save_config(userID=user["UserID"], config=request.config)
        return {"success": True, "scanID": scan_id}
    except Exception as e:
        print(f"Error saving config: {e}")
        raise HTTPException(status_code=500, detail="Failed to save configuration")
    
class UpdateConfigRequest(BaseModel):
    scanID: int = Field(..., description="Scan ID to update")
    config: Dict[str, Any] = Field(..., description="Updated scan configuration JSON object (must include startURL)")

@router.put("/update", summary="Update a saved scan configuration")
async def update_scan_config(
    request: UpdateConfigRequest,
    user: dict = Depends(get_current_user)
):
    try:
        await update_config(userID=user["UserID"], scanID=request.scanID, config=request.config)
        return {"success": True, "message": "Configuration updated successfully"}
    except HTTPException as http_exc:
        # Forward known errors (like 404 from update_config)
        raise http_exc
    except Exception as e:
        print(f"Error updating config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update configuration")

@router.delete("/{scan_id}", summary="Delete scan config and related data")
async def delete_scan_config(
    scan_id: int = Path(..., description="Scan ID to delete"),
    user: dict = Depends(get_current_user)
):
    conn = await get_connection()
    try:
        # Check and delete from linkResults
        link_result_count = await conn.fetchval("""
            SELECT COUNT(*) FROM linkResults WHERE "scanID" = $1
        """, scan_id)
        if link_result_count > 0:
            await conn.execute("""
                DELETE FROM linkResultsß WHERE "scanID" = $1
            """, scan_id)

        # Check and delete from scan_runs
        scan_run_count = await conn.fetchval("""
            SELECT COUNT(*) FROM "scan_runs" WHERE "scanID" = $1
        """, scan_id)
        if scan_run_count > 0:
            await conn.execute("""
                DELETE FROM "scan_runs" WHERE "scanID" = $1
            """, scan_id)

        # Always delete from scans (assuming this is the master record)
        await conn.execute("""
            DELETE FROM "scans" WHERE "scanID" = $1
        """, scan_id)

        return {"success": True, "message": f"Deleted scanID {scan_id} and related records if present."}

    except Exception as e:
        print(f"Error deleting scanID {scan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete configuration and related data")
    finally:
        await conn.close()

@router.post("/scan/{scan_id}")
async def start_scan(
    scan_id: int = Path(..., description="Scan ID to run scan for"),
    user: dict = Depends(get_current_user)
):
    try:
        result = await run_scan(userID=user["UserID"], scanID=scan_id)
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error running scan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to run scan: {str(e)}")