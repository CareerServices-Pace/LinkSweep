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
    always_exclude = ["facebook.com", "twitter.com", "linkedin.com", "mailto:", "tel:"]

    return (
        any(path in link for path in exclude_paths) or
        any(pattern in link.lower() for pattern in always_exclude)
    )

async def fetch_page(session, url, timeout):
    try:
        async with session.get(url, timeout=timeout, ssl=ssl.SSLContext()) as response:
            content = await response.text()
            return response.status, content
    except Exception:
        return None, None

async def check_link(session, source_page, link, timeout, base_url, exclude_paths, delay=0.2, retry_count=2):
    if should_exclude(link, exclude_paths):
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
    }

    await asyncio.sleep(delay)

    for attempt in range(retry_count + 1):
        try:
            async with session.get(link, timeout=timeout, ssl=ssl.SSLContext(), headers=headers) as resp:
                result = {
                    "sourcePage": source_page,
                    "link": link,
                    "statusCode": resp.status,
                    "statusText": resp.reason,
                    "linkType": "internal" if is_internal(base_url, link) else "external"
                }

                # Print link result with color
                if resp.status is None or resp.status >= 400:
                    print(f'\033[91m❌ {link} ({resp.status} {resp.reason})\033[0m')
                else:
                    print(f'\033[92m✅ {link} ({resp.status} {resp.reason})\033[0m')

                return result

        except Exception as e:
            if attempt == retry_count:
                print(f'\033[91m❌ {link} (Error: {str(e)})\033[0m')
                return {
                    "sourcePage": source_page,
                    "link": link,
                    "statusCode": None,
                    "statusText": str(e),
                    "linkType": "internal" if is_internal(base_url, link) else "external"
                }

        await asyncio.sleep(2 ** attempt)  # Exponential backoff

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

    async with aiohttp.ClientSession() as session:
        return await crawl_page(session, start_url, start_url, 0, max_depth, timeout, exclude_paths)