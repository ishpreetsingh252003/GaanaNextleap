# Gaana Discovery AI

> An AI-powered product concept that addresses repetitive music recommendations on Gaana — validated through public user review analysis and built as a NextLeap graduation project.

## Product Overview

Gaana Discovery AI is an AI-native product that tackles the core problem of repetitive and stale music recommendations on the Gaana platform. By analyzing public user feedback at scale and leveraging generative AI, the system surfaces hidden pain points, generates context-aware music recommendations, and delivers an interactive discovery experience that outperforms traditional algorithmic recommenders.

### Problem Statement

Gaana's existing recommendation pipeline prioritizes familiarity and popularity, causing meaningful music discovery to underperform for users who want:

- Fresher songs rather than repeated hits
- Better mood- and activity-aware suggestions
- Regional or non-English music that feels relevant
- Active discovery without manual search or playlist browsing

This leads to reduced discovery, repetitive listening, and lower long-term engagement among young Indian listeners (18–30) who are digitally savvy, genre-curious, and frustrated by static playlists.

### Business Opportunity

Solving this problem delivers measurable value:

- Increase session duration by reducing playlist fatigue
- Improve discovery metrics and active usage
- Surface long-tail and regional artists more effectively
- Demonstrate AI-native product differentiation from standard recommender systems
- Convert passive listeners into engaged discovery users

### Validation Approach

This project uses a **review-led validation approach** — leveraging publicly available user feedback signals (app store reviews, Reddit discussions, Quora threads, and tech blogs) as the primary validation source, instead of direct surveys or interviews.

> **Note:** No surveys or user interviews were conducted. All validation signals come from publicly available user reviews and online feedback.

## Product Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI Engine** | Groq SDK (llama-3.3-70b-versatile) |
| **Data Sources** | Google Play Store, Apple App Store, Reddit, Quora, Web News, Twitter/X |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Infrastructure** | GitHub, HTTPS/TLS, CORS |

### System Architecture

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

1. **Review Ingestion** → User selects sources (Google Play, App Store, Reddit, etc.). Backend scrapes reviews via source-specific scrapers.
2. **Review Cleaning** → Reviews are deduplicated, short/empty entries removed, and PII (emails, phones, usernames, URLs) is masked.
3. **AI Analysis** → Cleaned reviews are sent to Groq API, which extracts themes, sentiment, problem statements, and target user segments.
4. **Discovery Agent** → User preferences (mood, language, activity, freshness, reference, avoid list) are sent to Groq API, which generates 8–10 contextual music recommendations with explanations.
5. **Quick Actions** → Users can iteratively refine recommendations ("More fresh", "Change mood", "Avoid mainstream") without restarting the flow.

## Pages & Features

| Page | Path | Description |
|------|------|-------------|
| **Home** | `/` | Landing page with problem statement, product flow, and validation approach |
| **Review Engine** | `/reviews` | Multi-source review scraper with fallback data loading for demo |
| **Dashboard** | `/dashboard` | AI-generated analysis: themes, sentiment, quotes, problem statement |
| **Discovery Agent** | `/discovery` | Controllable music recommendations with mood, language, activity, and avoidance preferences |
| **About** | `/about` | Product concept explanation, validation approach, data sources, privacy, limitations |

## Local Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **Groq API Key** (get one at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository

```bash
git clone https://github.com/ishpreetsingh252003/GaanaNextleap.git
cd GaanaNextleap
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
- Click **Review Engine** → fetch reviews (or load fallback data) → view dashboard.
- Click **Discovery Agent** → enter preferences → see recommendations.

## Environment Variables

### Backend (`phase5/backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | **Yes** | — | Groq API key for AI analysis and recommendations |
| `PORT` | No | `3001` | Backend server port |
| `FRONTEND_URL` | No | `http://localhost:3000,http://localhost:3002` | Comma-separated allowed CORS origins (production: `https://gaana-nextleap.vercel.app`) |
| `NODE_ENV` | No | `development` | Set to `production` for deployed environments |
| `GOOGLE_PLAY_APP_ID` | No | `com.gaana` | Google Play app ID for scraping |
| `APP_STORE_APP_ID` | No | `1491726408` | Apple App Store numeric ID |
| `APP_STORE_COUNTRY` | No | `in` | App Store country code |
| `REDDIT_CLIENT_ID` | No | — | Reddit API client ID (optional) |
| `REDDIT_CLIENT_SECRET` | No | — | Reddit API client secret (optional) |
| `REDDIT_USER_AGENT` | No | `GaanaDiscoveryAI/5.0` | Reddit user agent string |
| `SCRAPE_DELAY_MS` | No | `1500` | Delay between scraper requests (ms) |
| `MAX_PAGES_PER_SOURCE` | No | `5` | Maximum pages to crawl per source |

**Production Note:**
- Set `FRONTEND_URL` to `https://gaana-nextleap.vercel.app` for production CORS
- Set `NODE_ENV=production`

### Frontend (`phase5/frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | **Yes** | `http://localhost:3001` | Backend API base URL (production: deployed backend URL) |
| `NEXT_PUBLIC_ENVIRONMENT` | No | `development` | Environment tag for diagnostics |

**Production Note:**
- Set `NEXT_PUBLIC_BACKEND_URL` to your deployed backend URL (e.g., `https://your-backend.onrender.com`)
- After updating environment variables, redeploy Vercel to apply changes

## API Endpoints

Base URL: `http://localhost:3001/api` (local) or `https://your-backend.onrender.com/api` (production)

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Returns backend health status and environment info |

### Reviews

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/reviews/sources` | List available review sources |
| `POST` | `/api/reviews/scrape` | Scrape reviews from selected sources |

**POST `/api/reviews/scrape` Request Body:**
```json
{
  "sources": ["google_play", "app_store", "reddit"],
  "fromDate": "2025-01-01",
  "toDate": "2026-07-02"
}
```

### Analysis

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analysis/review-analysis` | Run AI analysis on cleaned reviews via Groq |

### Discovery Agent

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/discovery-agent` | Generate AI-powered music recommendations |

**Request Body:**
```json
{
  "mood": "Gym",
  "language": "Punjabi",
  "activity": "Gym",
  "freshness": "Fresh",
  "reference": "Sidhu Moose Wala",
  "avoid": ["avoid_repeated_artists", "avoid_overplayed"]
}
```

**Valid Enum Values:**
- `mood`: `Chill`, `Sad`, `Party`, `Gym`, `Travel`, `Focus`, `Romantic`, `Energetic`
- `language`: `Hindi`, `Punjabi`, `Tamil`, `Telugu`, `Bhojpuri`, `English`, `Mixed`
- `activity`: `Studying`, `Travelling`, `Gym`, `Late night`, `Party`, `Work`, `Relaxing`
- `freshness`: `Safe`, `Balanced`, `Fresh`
- `avoid`: Any combination of `avoid_repeated_artists`, `avoid_mainstream`, `avoid_overplayed`, `avoid_sad`, `avoid_slow`

### Error Response Format

All API errors follow this structure:

```json
{
  "error_code": "ERROR_CODE",
  "error_message": "Human-readable description"
}
```

Common error codes: `GROQ_NOT_CONFIGURED`, `INVALID_SOURCES`, `NO_REVIEWS`, `TOO_FEW_REVIEWS`, `MISSING_REQUIRED_FIELDS`, `INVALID_MOOD`, `INVALID_LANGUAGE`, `INVALID_ACTIVITY`, `INVALID_FRESHNESS`, `SCRAPE_ERROR`, `ANALYSIS_ERROR`, `DISCOVERY_ERROR`, `INTERNAL_ERROR`

## Running Tests

```bash
cd phase5/backend
npm install
npm test
```

Tests cover:
- `groqService.test.ts` — Groq client initialization, retry logic, error handling
- `piiRemover.test.ts` — PII pattern detection and masking
- `reviewCleaner.test.ts` — Deduplication, empty removal, PII wipe cutoff

All 45 tests pass.

## Deployment

### Frontend → Vercel

1. Push code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Root Directory** to `phase5/frontend`.
4. Add Environment Variable: `NEXT_PUBLIC_BACKEND_URL` = your Render backend URL.
5. Click **Deploy**.

### Backend → Render

1. Go to [dashboard.render.com](https://dashboard.render.com) → New Web Service.
2. Connect GitHub repo.
3. Configure:
   - **Root Directory**: `phase5/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Add environment variables: `GROQ_API_KEY`, `FRONTEND_URL` (Vercel URL), `NODE_ENV=production`.
5. Deploy.

### Post-Deployment Checklist

- [ ] `GET /api/health` returns 200
- [ ] CORS headers allow requests from Vercel domain
- [ ] All frontend pages load without console errors
- [ ] HTTPS enabled on both Vercel and Render
- [ ] Environment variables are set (not hardcoded)

## Demo Flow Walkthrough

Recommended 60-second demo flow for graduation submission:

1. **Home Page** (`/`) — Show the problem statement and product flow.
2. **Review Engine** (`/reviews`) — Click **Fetch Reviews**. If scraping hits rate limits, click **Load Fallback Public Reviews** to demonstrate resilience.
3. **Dashboard** (`/dashboard`) — Highlight themes, sentiment breakdown, representative quotes, and the AI-generated problem statement. Or click **Load Sample Analysis** if no live data is available.
4. **Discovery Agent** (`/discovery`) — Click **Pre-fill Demo Query** to auto-fill:
   - Mood: `Gym`, Language: `Punjabi`, Activity: `Gym`, Freshness: `Fresh`
   - Reference: `Sidhu Moose Wala`
   - Avoid: `Avoid repeated artists`, `Avoid overplayed tracks`
5. **Recommendations** — Point out 8–10 cards with reasoning, freshness badges, and avoidance fields.
6. **Quick Action: More Fresh** — Re-generates with freshness bumped; show cards update live.
7. **About Page** (`/about`) — Read the validation approach and privacy/PII disclaimer to demonstrate awareness of data ethics.

## MVP Disclaimer

This MVP uses publicly available metadata/search results or sample catalog data to demonstrate the AI-powered discovery experience. It does **not** represent Gaana's full internal catalog. All scraped text is used solely for demonstration and research purposes.

## Known Limitations

1. **Catalog Scope**: Recommendations are based on public metadata — not Gaana's full internal catalog.
2. **Twitter/X Scraping**: Depends on Nitter mirror availability; results may be absent.
3. **Non-English Reviews**: Captured but not translated; AI analysis works best on English text.
4. **Rate Limits**: Google Play and App Store may rate-limit after repeated scraping.
5. **No Persistent Storage**: Reviews and analysis live in-memory; refreshing resets state.
6. **No Authentication**: API is unauthenticated; not suitable for public production without auth.
7. **Personalization**: Rule-based + LLM inference only. No user profiles or collaborative filtering.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend fails to start | Ensure `GROQ_API_KEY` is set in `.env` |
| CORS errors in browser | Verify `FRONTEND_URL` in backend `.env` includes your frontend origin |
| Groq API rate limited (429) | Wait 60 seconds and retry |
| Scraping returns no reviews | Load fallback data from the Review Engine page |
| Frontend shows blank page | Confirm `NEXT_PUBLIC_BACKEND_URL` matches backend address |
| Tests failing | Ensure `jest`, `ts-jest`, `@types/jest` are installed; run `npx jest --clearCache` |

## License

Educational / graduation submission use.
