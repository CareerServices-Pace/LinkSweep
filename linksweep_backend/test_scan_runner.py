import asyncio
from core.scan_runner import run_scan

async def main():
    print("🚀 Starting scan...")

    userID = 1  # Make sure this user exists in your DB

    config = {
        "startURL": "https://careerservices.pace.edu/",  # Try replacing with https://httpbin.org/ or a known fast site
        "maxDepth": 1,
        "timeout": 5,
        "excludePaths": [],
        "retryCount": 1,
        "autoScan": False,
        "autoScanTimes": []
    }

    try:
        print("🔧 Calling run_scan()...")
        result = await run_scan(userID, config)
        print("✅ Scan complete:")
        print(f"Scan ID: {result["scanID"]}")
        print(f"Total Links Checked: {result['totalLinks']}")
        print(f"Broken Links: {result['brokenLinks']}")
    except Exception as e:
        print("❌ Error occurred during scan:")
        print(repr(e))

if __name__ == "__main__":
    print("👋 Running main()")
    asyncio.run(main())