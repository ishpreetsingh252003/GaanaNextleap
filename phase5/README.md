# Gaana Discovery AI – Phase 5

> Production hardening, security, monitoring, and deployment ready for graduation submission.

## Project Overview

Gaana Discovery AI is an AI-native product that addresses the core problem of repetitive and stale music recommendations on the Gaana platform. By analyzing public user feedback and leveraging generative AI, the system surfaces hidden pain points, generates context-aware music recommendations, and delivers an interactive discovery experience that outperforms traditional algorithmic recommenders.

### Problem Statement

Gaana’s existing recommendation pipeline prioritizes familiarity and popularity, causing meaningful music discovery to underperform for users who want:

- fresher songs rather than repeated hits
- better mood- and activity-aware suggestions
- regional or non-English music that feels relevant
- active discovery without manual search or playlist browsing

This leads to reduced discovery, repetitive listening, and lower long-term engagement among young Indian listeners (18–30) who are digitally savvy, genre-curious, and frustrated by static playlists.

### Business Opportunity

Solving this problem delivers measurable value:

- increase session duration by reducing playlist fatigue
- improve discovery metrics and active usage
- surface long-tail and regional artists more effectively
- demonstrate AI-native product differentiation from standard recommender systems
- convert passive listeners into engaged discovery users

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI Engine** | Groq SDK (llama-3.3-70b-versatile) |
| **Data Sources** | Google Play Store, Apple App Store, Reddit, Quora, Web News, Twitter/X |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Infrastructure** | GitHub, HTTPS/TLS, CORS |

## Architecture Description

```
┌─────────────┐     HTTPS      ┌─────────────┐     HTTPS      ┌─────────────┐
│   Browser   │ ──────────────▶│   Vercel    │ ──────────────▶│   Render    │
│  (User)     │                │  Frontend   │                │   Backend   │
│             │ ◀──────────────│  (Next.js)  │ ◀──────────────│ (Express)   │
└─────────────┘                └─────────────┘                └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │   Groq API  │
                                                           │ (llama-3.3) │
                                                           └─────────────┘
```

### Data Flow

1. **Review Ingestion** → User selects sources (Google Play, App Store, Reddit, etc.) and date range. Backend scrapes reviews via source-specific scrapers.
2. **Review Cleaning** → Reviews are deduplicated, short/empty entries removed, and PII (emails, phones, usernames, URLs) is masked.
3. **AI Analysis** → Cleaned reviews are sent to Groq API, which extracts themes, sentiment, problem statements, and target user segments.
4. **Discovery Agent** → User preferences (mood, language, activity, freshness, reference, avoid list) are sent to Groq API, which generates 8–10 contextual music recommendations with explanations.
5. **Quick Actions** → Users can iteratively refine recommendations ("More fresh", "Change mood", "Avoid mainstream") without restarting the flow.

### Phase 5 Specific Enhancements

Phase 5 focuses on transitioning the Phase 4 MVP into a production-ready, graduation-quality submission.

#### Production Hardening

- Consistent error response format with `error_code`, `error_message`, and development-only `error_details`
- Request logging middleware capturing method, path, status code, and response duration
- CORS strictly configured via `FRONTEND_URL` environment variable (no wildcard origins)
- Input validation on all endpoints with specific validation errors
- Graceful fallbacks: CSV upload when Google Play scraping fails, retry logic in HTTP utilities
- API key never exposed in client-facing responses; sanitized logging only

#### Security

- All communications served over HTTPS/TLS in production
- Environment variables loaded from `.env` at server startup (never committed)
- PII removed from review text before AI analysis (masked, not stored)
- No personal listening data collected; no persistent user tracking
- Rate limiting documentation prepared for public deployment
- No stack traces or sensitive details returned to client in production mode

#### Monitoring & Observability

- Backend logs every request with timestamp, endpoint, HTTP method, status, and latency
- Error logs capture message and stack trace without PII or API keys
- Health check endpoint (`GET /api/health`) for uptime verification
- Render health check path configured for automatic restarts
- Vercel Analytics enabled for frontend performance insights

## Local Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **Groq API Key** (get one at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/gaana-discovery-ai.git
cd gaana-discovery-ai
```

### 2. Backend Setup

```bash
cd phase5/backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
npm install
npm run dev
```

Backend starts on `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd phase5/frontend
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
npm install
npm run dev
```

 Frontend starts on `http://localhost:3000`.

### 4. Verify Installation

- Open `http://localhost:3000` in your browser.
- Click **Analyze Reviews** → fetch reviews (or upload CSV) → view dashboard.
- Click **Try Discovery Agent** → enter preferences → see recommendations.

## Environment Variables Guide

### Backend (`phase5/backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | **Yes** | — | Groq API key for AI analysis and recommendations |
| `PORT` | No | `3001` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost:3000,http://localhost:3002` | Comma-separated allowed CORS origins |
| `NODE_ENV` | No | `development` | Set to `production` for deployed environments |
| `GOOGLE_PLAY_APP_ID` | No | `com.gaana` | Google Play app ID for scraping |
| `APP_STORE_APP_ID` | No | `1491726408` | Apple App Store numeric ID |
| `APP_STORE_COUNTRY` | No | `in` | App Store country code |
| `REDDIT_CLIENT_ID` | No | — | Reddit API client ID (optional) |
| `REDDIT_CLIENT_SECRET` | No | — | Reddit API client secret (optional) |
| `REDDIT_USER_AGENT` | No | `GaanaDiscoveryAI/5.0` | Reddit user agent string |
| `SCRAPE_DELAY_MS` | No | `1500` | Delay between scraper requests (ms) |
| `MAX_PAGES_PER_SOURCE` | No | `5` | Maximum pages to crawl per source |

### Frontend (`phase5/frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | **Yes** | `http://localhost:3001` | Backend API base URL |
| `NEXT_PUBLIC_ENVIRONMENT` | No | `development` | Environment tag for diagnostics |

## API Endpoints Documentation

Base URL: `http://localhost:3001/api` (local) or `https://your-backend.onrender.com/api` (production)

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Returns backend health status, phase, environment, and timestamp |

**Response:**
```json
{
  "status": "ok",
  "phase": 5,
  "message": "Gaana Discovery AI backend (Phase 5 – Production Ready) is running",
  "environment": "production",
  "timestamp": "2026-07-02T15:00:00.000Z"
}
```

### Reviews

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reviews/sources` | List available review sources with labels and descriptions |
| `POST` | `/reviews/scrape` | Scrape reviews from selected sources |

**POST `/api/reviews/scrape` Request Body:**
```json
{
  "sources": ["google_play", "app_store", "reddit"],
  "fromDate": "2025-01-01",
  "toDate": "2026-07-02"
}
```

**Response:**
```json
{
  "success": true,
  "total_reviews": 245,
  "date_range": { "from": "2025-01-01", "to": "2026-07-02" },
  "sources_summary": { "google_play": 180, "reddit": 65 },
  "reviews": [ /* cleaned Review[] */ ],
  "errors": []
}
```

### Analysis

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analysis/review-analysis` | Run AI analysis on cleaned reviews via Groq |

**Request Body:**
```json
{
  "reviews": [
    {
      "source": "google_play",
      "rating": 2,
      "title": "Same songs every day",
      "text": "App keeps recommending the same Bollywood hits...",
      "review_date": "2026-03-15T00:00:00Z",
      "cleaned_text": "App keeps recommending the same Bollywood hits...",
      "cleaning_applied": ["duplicate_check", "empty_removed"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total_reviews_submitted": 300,
  "analysis": {
    "summary": "Users are frustrated by repetitive recommendations and ad-heavy free tiers.",
    "total_reviews_analyzed": 100,
    "date_range": "2026-01-01 to 2026-07-02",
    "themes": [
      {
        "theme_name": "Repetitive Recommendations",
        "count": 87,
        "description": "Users report receiving the same songs and artists repeatedly.",
        "pain_point": "Playlist fatigue; lack of fresh discovery",
        "representative_quotes": ["Quote...", "..."],
        "opportunity": "Implement mood-aware discovery"
      }
    ],
    "sentiment_summary": { "positive": 15, "neutral": 40, "negative": 45 },
    "target_user_segment": "Young Indian listeners 18–30...",
    "problem_statement": "Users want fresh but relevant music...",
    "business_opportunity": "Gaana can improve retention by..."
  }
}
```

### Discovery Agent

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/discovery-agent` | Generate AI-powered music recommendations |

**Request Body:**
```json
{
  "mood": "Chill",
  "language": "Hindi",
  "activity": "Studying",
  "freshness": "Balanced",
  "reference": "Arijit Singh",
  "avoid": ["avoid_repeated_artists", "avoid_mainstream"]
}
```

**Valid Values:**
- `mood`: `Chill`, `Sad`, `Party`, `Gym`, `Travel`, `Focus`, `Romantic`, `Energetic`
- `language`: `Hindi`, `Punjabi`, `Tamil`, `Telugu`, `Bhojpuri`, `English`, `Mixed`
- `activity`: `Studying`, `Travelling`, `Gym`, `Late night`, `Party`, `Work`, `Relaxing`
- `freshness`: `Safe`, `Balanced`, `Fresh`
- `avoid`: Any combination of `avoid_repeated_artists`, `avoid_mainstream`, `avoid_overplayed`, `avoid_sad`, `avoid_slow`

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "title": "Song Name",
      "artist_or_type": "Artist Name",
      "language_mood_fit": "Why this fits the language and mood",
      "why_this_fits": "Specific reasoning based on user preferences",
      "how_fresh_this_is": "New release / Emerging artist / Underrated gem",
      "freshness_label": "Balanced",
      "avoids_repeating": "Not from the same artist as reference"
    }
  ],
  "explanation": "Overall discovery approach summary",
  "query_used": "Echo of user's input"
}
```

### Error Response Format

All API errors follow this structure:

```json
{
  "error_code": "ERROR_CODE",
  "error_message": "Human-readable description",
  "error_details": "Stack trace or technical details (development only)"
}
```

Common error codes:
- `GROQ_NOT_CONFIGURED` — API key missing
- `INVALID_SOURCES` — Scraper source not recognized
- `NO_REVIEWS` / `TOO_FEW_REVIEWS` — Analysis prerequisites not met
- `MISSING_REQUIRED_FIELDS` — Discovery payload incomplete
- `INVALID_MOOD`, `INVALID_LANGUAGE`, `INVALID_ACTIVITY`, `INVALID_FRESHNESS` — Enum validation failures
- `SCRAPE_ERROR` — Scraping pipeline failure
- `ANALYSIS_ERROR` / `DISCOVERY_ERROR` — Groq API call failed
- `INTERNAL_ERROR` — Unhandled server error

## Running Tests

### Backend Tests

Phase 5 introduces unit tests for core backend services using Jest.

```bash
cd phase5/backend
npm install          # installs base dependencies
npm install --save-dev jest ts-jest @types/jest @types/node
npm test
```

Tests cover:
- `groqService.test.ts` — Groq client initialization, retry logic, error handling
- `piiRemover.test.ts` — PII pattern detection and masking
- `reviewCleaner.test.ts` — Deduplication, empty removal, PII wipe cutoff

### Frontend Tests

Frontend testing scaffolding is prepared for Phase 5 but the primary focus is backend service unit tests for this submission.

## Deployment

### Frontend → Vercel

1. Push code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Root Directory** to `phase5/frontend`.
4. Add Environment Variable:
   - `NEXT_PUBLIC_BACKEND_URL` = your Render backend URL (e.g., `https://gaana-phase5-backend.onrender.com`)
5. Click **Deploy**.
6. Vercel assigns a public URL (e.g., `https://gaana-discovery-ai.vercel.app`).

**Custom Domain (optional):** Navigate to project settings → Domains → add your domain.

### Backend → Render

Option A: Using the `render.yaml` Blueprint (recommended)

1. Push code to GitHub.
2. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) and click **New Blueprint Instance**.
3. Connect your GitHub repo.
4. Render reads `phase5/deployment/render.yaml` and creates the service automatically.
5. Set environment variables in the Render dashboard:
   - `GROQ_API_KEY`
   - `FRONTEND_URL` = your Vercel frontend URL
   - `NODE_ENV` = `production`
6. Deploy.

Option B: Manual service creation

1. Go to [dashboard.render.com/create](https://dashboard.render.com/create).
2. Select **Web Service**.
3. Connect GitHub repo.
4. Configure:
   - **Name**: `gaana-phase5-backend`
   - **Root Directory**: `phase5/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free (or paid for always-on)
5. Add environment variables as above.
6. Click **Create Web Service**.

### Post-Deployment Checklist

- [ ] `GET /api/health` returns 200 with `status: "ok"`
- [ ] CORS headers allow requests from Vercel domain
- [ ] Groq analysis completes in <45s for 300 reviews
- [ ] Discovery agent returns recommendations in <10s
- [ ] All frontend pages load without console errors
- [ ] HTTPS enabled on both Vercel and Render
- [ ] Environment variables are set (not hardcoded)

## Known Limitations

1. **Music Catalog Scope**: The Phase 5 backend uses public metadata and Groq-generated catalog data to demonstrate the discovery experience. It does **not** represent Gaana’s full internal catalog or licensing. See the About page disclaimer.
2. **Twitter/X Scraping**: Depends on public Nitter mirror availability, which can be unreliable. Twitter results may be absent.
3. **Non-English Reviews**: Reviews in regional languages are captured but not translated; AI analysis performs best on English text.
4. **Rate Limits**: Google Play and App Store may rate-limit scraping after many requests.
5. **Curation Quality**: Recommendations are AI-generated and may not always match exact user intent; this MVP is for demonstration.
6. **No Persistent Storage**: Reviews and analysis results live in-memory only; refreshing the browser resets state.
7. **No Authentication**: The API is public and unauthenticated; do not expose sensitive endpoints without auth in production.

## Demo Flow Walkthrough

This is the recommended 60-second demo flow for graduation submission:

1. **Open `/`** — Show the home page with problem statement and flow diagram.
2. **Navigate to Analyze Reviews** (`/reviews`) — Click **Fetch Reviews**. If scraping hits rate limits, upload `test_reddit_web.json` via CSV fallback to show resilience.
3. **View Dashboard** (`/dashboard`) — Highlight the 5 themes, sentiment breakdown, representative quotes, and AI-generated problem statement.
4. **Navigate to Discovery Agent** (`/discovery`) — Enter:
   - Mood: `Chill`
   - Language: `Hindi`
   - Activity: `Studying`
   - Freshness: `Balanced`
   - Reference: `Arijit Singh`
   - Avoid: `Avoid mainstream`
5. **Show Recommendations** — Point out 8–10 cards with reasoning, freshness badges, and "avoids repeating" fields.
6. **Click Quick Action: More Fresh** — Re-generates with freshness bumped to Fresh; show the cards update.
7. **About Page** (`/about`) — Read the privacy/PII disclaimer aloud to demonstrate awareness of data ethics.

## Troubleshooting Guide

### Backend fails to start

- Ensure `GROQ_API_KEY` is set in `.env` (not `.env.example`).
- Check port 3001 is not already in use: `netstat -ano | findstr :3001`
- Run `npm run dev` to see detailed logs.

### CORS errors in browser console

- Verify `FRONTEND_URL` in backend `.env` includes your frontend origin.
- For Vercel + Render, set `FRONTEND_URL=https://<your-vercel-app>.vercel.app`.

### Groq API returns 429 / rate limited

- Groq free tier has rate limits. Wait 60 seconds and retry.
- Reduce `max_reviews_to_analyze` in `backend/src/services/groqService.ts` (Phase 5 already caps at 100).

### Scraping returns no reviews

- Google Play and App Store may block repeated requests.
- Upload CSV data manually as a fallback.
- Reduce `MAX_PAGES_PER_SOURCE` in `.env` to avoid timeouts.

### Frontend shows blank page

- Confirm `NEXT_PUBLIC_BACKEND_URL` matches the backend address.
- Check Vercel build logs for errors.
- Ensure the backend is running and `/api/health` returns 200.

### Tests failing

- Ensure `jest`, `ts-jest`, and `@types/jest` are installed.
- Run `npx jest --clearCache` if tests fail to pick up TypeScript.
- Verify Node.js version is 18+.

## License

Educational / graduation submission use.
