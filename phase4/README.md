# Gaana Discovery AI – Phase 4

Phase 4 completes the Gaana Discovery AI application by adding a functional AI-powered music discovery agent. This phase integrates all previous components (scraping, analysis, and discovery) into a complete end-to-end system.

## Overview

Phase 4 includes:
- **Backend**: Complete Express.js API with scrapers, AI analysis, and music recommendation endpoints
- **Frontend**: Next.js 15 application with pages for reviews, dashboard, discovery, and about
- **AI Integration**: Groq SDK for review analysis and personalized music recommendations

## Project Structure

```
phase4/
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── app.ts          # Express app setup with middleware and routes
│   │   ├── server.ts       # Server entry point
│   │   ├── routes/         # API route handlers
│   │   │   ├── reviews.ts  # Review scraping endpoints
│   │   │   ├── analysis.ts # AI review analysis endpoint
│   │   │   ├── discovery.ts # Music recommendation endpoint
│   │   │   └── health.ts   # Health check endpoint
│   │   ├── services/       # Business logic
│   │   │   ├── groqService.ts      # Groq AI integration
│   │   │   ├── piiRemover.ts       # PII detection and masking
│   │   │   ├── reviewCleaner.ts    # Review deduplication and cleaning
│   │   │   └── scrapeOrchestrator.ts # Scraper orchestration
│   │   ├── scrapers/       # Source-specific scrapers
│   │   │   ├── googlePlayScraper.ts
│   │   │   ├── appStoreScraper.ts
│   │   │   ├── redditScraper.ts
│   │   │   ├── quoraScraper.ts
│   │   │   ├── webNewsScraper.ts
│   │   │   └── twitterScraper.ts
│   │   ├── types/          # TypeScript type definitions
│   │   │   └── review.ts
│   │   ├── utils/          # Utility functions
│   │   │   ├── http.ts     # HTTP utilities with retry
│   │   │   └── dateFilter.ts # Date filtering utilities
│   │   └── middleware/     # Express middleware
│   │       ├── errorHandler.ts
│   │       └── logger.ts
│   ├── package.json
│   └── tsconfig.json
└── frontend/               # Next.js frontend application
    ├── app/
    │   ├── layout.tsx      # Root layout
    │   ├── page.tsx        # Home page
    │   ├── globals.css     # Global styles
    │   ├── reviews/        # Review scraping page
    │   │   └── page.tsx
    │   ├── dashboard/      # Analysis dashboard page
    │   │   └── page.tsx
    │   ├── discovery/      # Music discovery page
    │   │   └── page.tsx
    │   └── about/          # About page
    │       └── page.tsx
    ├── lib/
    │   └── api.ts          # API client functions
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    └── next.config.js
```

## Backend Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd phase4/backend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_PLAY_APP_ID=com.gaana
APP_STORE_APP_ID=com.gaana
PORT=3001
```

### Running the Backend

```bash
npm run dev
```

The backend will start on `http://localhost:3001`

## Frontend Setup

### Installation

```bash
cd phase4/frontend
npm install
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Running the Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check backend health status

### Reviews
- `GET /api/reviews/sources` - Get available review sources
- `POST /api/reviews/scrape` - Scrape reviews from selected sources
  - Body: `{ sources: ["google_play", "app_store", ...] }`

### Analysis
- `POST /api/analysis/review-analysis` - Analyze reviews with AI
  - Body: `{ reviews: [...] }`

### Discovery
- `POST /api/discovery-agent` - Generate music recommendations
  - Body: 
    ```json
    {
      "mood": "Happy / Uplifting",
      "language": "Hindi",
      "activity": "Work / Study",
      "freshness": "Trending now (last 3 months)",
      "reference": "Optional reference song",
      "avoid": ["Artist1", "Genre1"]
    }
    ```

## Features

### 1. Multi-Source Review Scraping
- **Google Play Store**: Reviews via google-play-scraper
- **Apple App Store**: Reviews via app-store-scraper
- **Reddit**: Posts from relevant subreddits
- **Quora**: Snippets via DuckDuckGo search
- **Web/News**: Articles and forum posts
- **Twitter/X**: Tweets via Nitter mirror instances

### 2. Review Cleaning & PII Removal
- Email address masking
- Phone number masking
- Username masking
- URL masking
- Deduplication of similar reviews
- Date filtering (Jan 2026 → today)

### 3. AI-Powered Analysis
- Theme extraction from reviews
- Sentiment analysis (positive/neutral/negative)
- Problem statement generation
- Target user segment identification
- Business opportunity detection

### 4. Music Discovery Agent
- Personalized recommendations based on:
  - Mood (Happy, Sad, Relaxed, Energetic, etc.)
  - Language (Hindi, Punjabi, English, etc.)
  - Activity (Commute, Workout, Party, etc.)
  - Freshness preference (Trending, Recent, Classics)
  - Reference song (optional)
  - Avoid list for artists/genres
- Detailed reasoning for each recommendation
- Freshness labels (Safe, Balanced, Fresh)

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Groq SDK
- **Scraping**: 
  - google-play-scraper
  - app-store-scraper
  - axios + cheerio
- **Utilities**: date-fns

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks

## Known Limitations

1. **Twitter/X Scraping**: Depends on Nitter mirror availability
2. **Quora/Web News**: May be blocked by paywalls
3. **Rate Limiting**: App Store and Google Play may rate-limit
4. **Reddit API**: Public API caps at ~25 results per page
5. **Non-English Reviews**: Captured but not translated
6. **AI Analysis**: Works best on English text

## Development Notes

### Lint Errors
The project may show TypeScript lint errors until dependencies are installed:
- Missing `@types/node` for backend
- Missing `groq-sdk` package
- Missing scraper packages
- Missing React/Next.js types for frontend

These errors resolve after running `npm install` in both backend and frontend directories.

### Date Range
All scrapers filter reviews to **January 1, 2026 → today**. Older content is discarded at the scraper level.

### Privacy
- No data is stored permanently
- All reviews live in-memory for the session only
- PII is removed before analysis
- HTTPS/TLS for all API communication

## Future Enhancements

- Add database persistence for reviews and analysis results
- Implement user authentication
- Add more music sources for recommendations
- Support for regional languages in AI analysis
- Real-time review streaming
- Mobile app development
