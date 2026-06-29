# Gaana Discovery AI – Phase 2: Multi-Source Review Scraper

## What's New in Phase 2

Phase 2 replaces the CSV-upload placeholder with a **real multi-source scraping pipeline** that pulls Gaana user feedback from 6 live sources, cleans it, and exposes it for AI analysis in Phase 3.

| Source | Method | Library |
|---|---|---|
| 🤖 Google Play Store | Internal API (newest sort) | `google-play-scraper` v10 |
| 🍎 Apple App Store | Apple RSS/API (India) | `app-store-scraper` v0.18 |
| 👽 Reddit | Public JSON API (no auth) | `axios` + custom pagination |
| 💬 Quora | DuckDuckGo site-search snippets | `axios` + `cheerio` |
| 🌐 Web / News | DuckDuckGo search + page scrape | `axios` + `cheerio` |
| 🐦 Twitter / X | Nitter mirror HTML | `axios` + `cheerio` |

All results are filtered to **Jan 1 2026 → today**, deduplicated, and run through PII removal before being returned.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Backend

```bash
cd phase2/backend
copy .env.example .env        # fill in values (most have defaults)
npm install
npm run dev                   # starts on :3001
```

**Key endpoints:**

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/reviews/sources` | List all available scraper sources |
| POST | `/api/reviews/scrape` | Run scrapers and return cleaned reviews |

**POST `/api/reviews/scrape` body (all optional):**
```json
{
  "sources": ["google_play", "app_store", "reddit"]
}
```
Omit `sources` to run all 6.

**Response shape:**
```json
{
  "success": true,
  "total_reviews": 312,
  "date_range": { "from": "2026-01-01T00:00:00.000Z", "to": "2026-06-25T..." },
  "sources_summary": {
    "google_play": 120,
    "app_store": 80,
    "reddit": 45,
    "quora": 12,
    "web_news": 38,
    "twitter_web": 17
  },
  "errors": [],
  "reviews": [ ... ]
}
```

### Frontend

```bash
cd phase2/frontend
copy .env.example .env.local
npm install
npm run dev                   # starts on :3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |
| `GOOGLE_PLAY_APP_ID` | Play Store app ID | `com.gaana` |
| `APP_STORE_APP_ID` | App Store numeric ID | `1491726408` |
| `APP_STORE_COUNTRY` | App Store country code | `in` |
| `REDDIT_USER_AGENT` | Reddit User-Agent string | `GaanaDiscoveryAI/2.0` |
| `SCRAPE_DELAY_MS` | Polite delay between requests | `1500` |
| `MAX_PAGES_PER_SOURCE` | Max pages per scraper | `5` |
| `NODE_ENV` | `development` or `production` | `development` |

### Frontend (`frontend/.env.local`)

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3001` |

---

## Architecture

```
phase2/backend/src/
├── app.ts                         # Express app + middleware
├── server.ts                      # Entry point
├── types/
│   ├── review.ts                  # Shared Review type + source enum
│   └── app-store-scraper.d.ts     # Type declaration shim
├── utils/
│   ├── http.ts                    # fetchWithRetry + sleep helpers
│   └── dateFilter.ts              # isWithinRange + SCRAPE_FROM constant
├── scrapers/
│   ├── googlePlayScraper.ts       # Google Play scraper
│   ├── appStoreScraper.ts         # Apple App Store scraper
│   ├── redditScraper.ts           # Reddit JSON API scraper
│   ├── quoraScraper.ts            # Quora via DuckDuckGo
│   ├── webNewsScraper.ts          # Web / News via DuckDuckGo + Cheerio
│   └── twitterScraper.ts          # Twitter via Nitter mirrors
├── services/
│   ├── piiRemover.ts              # Regex-based PII masking
│   ├── reviewCleaner.ts           # Dedup + clean + stats
│   └── scrapeOrchestrator.ts      # Runs scrapers concurrently, merges results
├── routes/
│   ├── health.ts                  # GET /api/health
│   └── reviews.ts                 # GET /api/reviews/sources, POST /api/reviews/scrape
└── middleware/
    ├── errorHandler.ts
    └── logger.ts
```

---

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| Phase 1 | ✅ Done | Foundation – Express + Next.js scaffold |
| Phase 2 | ✅ Done | Multi-source scraping – 6 live sources, PII removal, dedup |
| Phase 3 | 🔜 Next | Groq AI analysis – themes, sentiment, pain points, dashboard |
| Phase 4 | 🔜 | Discovery agent – preference form, recommendations, quick actions |
| Phase 5 | 🔜 | Polish, testing, deployment |

---

## Scraper Design Decisions

**Why no Puppeteer/Playwright?**
All 6 sources return usable data without a headless browser — either via a documented API (`google-play-scraper`, `app-store-scraper`, Reddit JSON), a cooperative search engine (DuckDuckGo HTML), or a Twitter mirror (Nitter). Puppeteer adds ~250ms cold-start and 200MB RAM overhead per page; not worth it here.

**Why DuckDuckGo over Google for Quora/Web?**
Google's HTML search blocks bots aggressively. DuckDuckGo's `html.duckduckgo.com/html/` endpoint is designed for programmatic access and doesn't require JS rendering.

**Why Nitter for Twitter?**
Twitter removed free API access in 2023. Nitter mirrors proxy public tweet data without authentication. The scraper tries multiple instances and falls back gracefully to 0 results if all are offline.

**Rate limiting strategy:**
- `SCRAPE_DELAY_MS` (default 1500ms) between pages on the same source
- `MAX_PAGES_PER_SOURCE` (default 5) caps requests per source
- Exponential backoff with jitter on HTTP failures (up to 3 retries)
- Scrapers stop early if they see 20 consecutive out-of-range dates
