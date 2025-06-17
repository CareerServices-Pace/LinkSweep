# 🔗 LinkSweep

**LinkSweep** is an automated broken link checker that crawls websites to identify invalid, broken, or unreachable links. Designed with usability in mind, it features a web interface for manual scans, automated daily checks, and exportable reports in CSV and PDF format.

---

## 🚀 Features

- ✅ Web-based configuration and scanning interface
- ✅ Manual scan trigger via dashboard
- ✅ Automated daily scans (with configurable schedule)
- ✅ Adjustable crawl depth and exclusion paths
- ✅ Link status classification (Success, Broken, Timeout, Redirected)
- ✅ Export scan results to **CSV** and **PDF**
- ✅ View past scans and download reports

---

## 🧠 How It Works

1. User provides a base URL and configures scan settings through the interface.
2. A crawler navigates the site, collecting all internal/external links.
3. Each link is validated for availability and response status.
4. A report is generated and available for download.
5. Past scans are saved and accessible through the history screen.

---

## 🛠 Configuration Options

| Option            | Description                                      |
|-------------------|--------------------------------------------------|
| `startUrl`        | Base URL for crawling                            |
| `maxDepth`        | Depth of recursive crawl                         |
| `excludedPaths`   | Array of strings or regex to skip certain paths  |
| `timeoutSeconds`  | Timeout for each HTTP request                    |
| `retryCount`      | Retry attempts for failed URLs                   |
| `autoScan`        | Enable or disable automated scanning             |
| `autoScanTime`    | Daily time to trigger auto scan (24-hr format)   |

You can configure these via the interface or with a `config.json`.
