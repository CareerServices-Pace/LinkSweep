import aiohttp
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from typing import List, Dict
import ssl

visited_pages = set()

def is_internal(base_url, link_url):
    return urlparse(base_url).netloc == urlparse(link_url).netloc

def should_exclude(link, exclude_paths):
    # Always-ignore patterns
    always_exclude = []

    return (
        any(path in link for path in exclude_paths) 
        # or
        # any(pattern in link.lower() for pattern in always_exclude)
    )

def get_fix_guide(status_code, diagnosis):
    if diagnosis is None:
        return ""

    if status_code == 429:
        return "This page is blocking too many requests. Try scanning slower, or check it manually in a browser."
    if status_code == 403:
        return "Access is forbidden — the page might block bots or require permissions. Check it manually."
    if status_code == 401:
        return "Login is required to view this page. Try logging in and checking it directly."
    if "Redirected to login" in diagnosis:
        return "This page redirected to a login screen. Try opening it manually after logging in."
    if status_code == 404:
        return "The page doesn't exist. Consider removing or updating the link."
    if status_code is None:
        return "We couldn't check this link due to a technical error. Try again later or check manually."
    if status_code >= 500:
        return "The website has a server issue. Try again later or report it to the site owner."

    return "No issues detected or no fix available."


async def fetch_page(session, url, timeout):
    ssl_context = ssl.create_default_context()
    try:
        async with session.get(url, timeout=timeout, ssl=ssl_context) as response:
            content = await response.text()
            return response.status, content
    except Exception:
        return None, None

async def check_link(session, source_page, link, timeout, base_url, exclude_paths, delay=1, retry_count=2):
    if should_exclude(link, exclude_paths):
        return None

    await asyncio.sleep(delay)  # ⏱️ Throttle

    diagnosis = ""
    redirected_to_login = False

    ssl_context = ssl.create_default_context()

    for attempt in range(retry_count + 1):
        try:
            async with session.get(link, timeout=timeout, ssl=ssl_context, allow_redirects=True) as resp:
                final_url = str(resp.url).lower()
                redirected_to_login = any(keyword in final_url for keyword in ["login", "signin", "auth"])

                status = resp.status
                diagnosis = None

                if status == 429:
                    diagnosis = "Too many requests – possibly rate-limited or bot-blocked."
                elif status == 403:
                    diagnosis = "Access forbidden – may be bot-protection or restricted page."
                elif status == 401:
                    diagnosis = "Unauthorized – login likely required."
                elif redirected_to_login:
                    diagnosis = "Redirected to login page – protected resource."
                elif status == 404:
                    diagnosis = "Not found – broken or moved link."
                elif status >= 500:
                    diagnosis = "Server error – issue on target site."
                elif status is None:
                    diagnosis = "Request failed – possible DNS, timeout, or connection error."


                fix_guide = get_fix_guide(status, diagnosis)

                result = {
                    "sourcePage": source_page,
                    "link": link,
                    "statusCode": status,
                    "statusText": resp.reason,
                    "linkType": "internal" if is_internal(base_url, link) else "external",
                    "redirectedToLogin": redirected_to_login,
                    "diagnosis": diagnosis,
                    "fixGuide": fix_guide
                }

                # ✅ Colored terminal output
                if status is None or status >= 400:
                    print(f'\033[91m❌ {link} ({status} {resp.reason}) -> {diagnosis or ""}\033[0m')
                else:
                    print(f'\033[92m✅ {link} ({status} {resp.reason})\033[0m')

                return result

        except Exception as e:
            if attempt == retry_count:
                print(f'\033[91m❌ {link} (Error: {str(e)})\033[0m')
                return {
                    "sourcePage": source_page,
                    "link": link,
                    "statusCode": None,
                    "statusText": str(e),
                    "linkType": "internal" if is_internal(base_url, link) else "external",
                    "redirectedToLogin": False,
                    "diagnosis": "Failed to load – possible DNS, timeout, or firewall issue.",
                    "fixGuide": ""
                }

        # 📈 Backoff retry
        await asyncio.sleep(2 ** attempt)

async def crawl_page(session, url, base_url, depth, max_depth, timeout, exclude_paths):
    results = []

    if depth > max_depth or url in visited_pages or should_exclude(url, exclude_paths):
        return results

    visited_pages.add(url)

    status, html = await fetch_page(session, url, timeout)
    if not html:
        return results

    soup = BeautifulSoup(html, 'html.parser')
    tags = soup.find_all(['a', 'img', 'script', 'link'])

    link_tasks = []
    found_links = set()

    for tag in tags:
        attr = 'href' if tag.name in ['a', 'link'] else 'src'
        link = tag.get(attr)
        if link:
            full_link = urljoin(url, link)
            if full_link not in found_links:
                found_links.add(full_link)
                link_tasks.append(
                    check_link(session, url, full_link, timeout, base_url, exclude_paths)
                )

    page_results = await asyncio.gather(*link_tasks)
    results.extend([res for res in page_results if res])

    # Recursive crawl on internal links
    internal_links = [
        urljoin(url, tag.get('href'))
        for tag in soup.find_all('a', href=True)
        if is_internal(base_url, urljoin(url, tag.get('href')))
    ]

    for link in internal_links:
        results.extend(
            await crawl_page(session, link, base_url, depth + 1, max_depth, timeout, exclude_paths)
        )

    return results

async def start_crawl(start_url: str, max_depth: int, timeout: int, exclude_paths: List[str]) -> List[Dict]:
    global visited_pages
    visited_pages = set()

    headers = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/114.0.5735.198 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
}

    async with aiohttp.ClientSession(headers=headers) as session:
        return await crawl_page(session, start_url, start_url, 0, max_depth, timeout, exclude_paths)