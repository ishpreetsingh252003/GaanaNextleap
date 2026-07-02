# Gaana Discovery AI – Backend (Phase 5)

Express.js + TypeScript backend powering the AI review analysis engine and music discovery agent.

## Setup Commands

```bash
cd phase5/backend
cp .env.example .env
npm install
npm run dev
```

Server starts on `http://localhost:3001`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with ts-node |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled server (`dist/server.js`) |
| `npm run lint` | Run ESLint on `src/` |
| `npm test` | Run Jest unit tests |

## API Reference

### Base URL
`http://localhost:3001/api`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/reviews/sources` | List scraper sources |
| `POST` | `/reviews/scrape` | Run multi-source scraping |
| `POST` | `/analysis/review-analysis` | AI analysis of reviews |
| `POST` | `/discovery-agent` | Generate music recommendations |

See the main [README.md](../README.md#api-endpoints-documentation) for detailed request/response examples.

## Testing

```bash
npm install --save-dev jest ts-jest @types/jest @types/node
npm test
```

Test files live in `tests/`:
- `groqService.test.ts` — Groq client, retry logic, error handling
- `piiRemover.test.ts` — PII regex patterns and masking
- `reviewCleaner.test.ts` — Deduplication, empty removal, PII wipe cutoff

## Deployment

Deploy to Render using the included `../deployment/render.yaml` Blueprint, or manually:

1. Create a **Web Service** on Render.
2. Connect your GitHub repo.
3. Set **Root Directory** to `phase5/backend`.
4. Set **Build Command** to `npm install && npm run build`.
5. Set **Start Command** to `npm run start`.
6. Add env vars: `GROQ_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`.
7. Set **Health Check Path** to `/api/health`.

See the main [README.md](../README.md#deployment) for the full deployment guide.

## Project Structure

```
phase5/backend/
├── src/
│   ├── app.ts                       # Express app + middleware
│   ├── server.ts                    # Entry point
│   ├── routes/
│   │   ├── health.ts                # GET /health
│   │   ├── reviews.ts               # Scrape endpoints
│   │   ├── analysis.ts              # AI analysis endpoint
│   │   └── discovery.ts             # Discovery agent endpoint
│   ├── services/
│   │   ├── groqService.ts           # Groq SDK wrapper
│   │   ├── piiRemover.ts            # PII masking
│   │   ├── reviewCleaner.ts         # Dedup + cleaning
│   │   └── scrapeOrchestrator.ts    # Scraper orchestration
│   ├── scrapers/                    # Source-specific scrapers
│   ├── types/                       # TypeScript interfaces
│   ├── utils/                       # HTTP, date, retry utilities
│   └── middleware/                   # Logger, error handler
├── tests/                           # Jest unit tests
├── package.json
├── tsconfig.json
└── .env.example
```
