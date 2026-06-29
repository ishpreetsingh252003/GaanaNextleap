# Gaana Discovery AI – Phase 1

## Overview

Phase 1 delivers the **foundation infrastructure** for the Gaana Discovery AI project:

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS | Vercel |
| Backend | Node.js + Express + TypeScript | Railway |
| AI Engine | Groq API (Phases 3–4) | – |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- A Groq API key (https://console.groq.com) — not required for Phase 1

### 1. Backend

```bash
cd phase1/backend
cp .env.example .env          # fill in values
npm install
npm run dev                   # starts on port 3001
```

Verify: `GET http://localhost:3001/api/health` → `{ "status": "ok" }`

### 2. Frontend

```bash
cd phase1/frontend
cp .env.example .env.local    # set NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
npm install
npm run dev                   # starts on port 3000
```

Open http://localhost:3000 – you should see the home page with a green "Connected" status.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (Phase 3+) | – |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated | `http://localhost:3000` |
| `NODE_ENV` | `development` or `production` | `development` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment label | `development` |

---

## API Endpoints (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check – returns status, environment, timestamp |

---

## Deployment

### Vercel (Frontend)
1. Push this folder to GitHub.
2. Import the `phase1/frontend` folder in Vercel.
3. Set env var: `NEXT_PUBLIC_BACKEND_URL` → your Railway backend URL.
4. Deploy.

### Railway (Backend)
1. Import the `phase1/backend` folder in Railway.
2. Set env vars: `GROQ_API_KEY`, `FRONTEND_URL` (Vercel URL), `NODE_ENV=production`.
3. Railway auto-detects `npm start` → runs `node dist/server.js` after build.

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Done | Foundation – backend, frontend scaffold, routing, CORS |
| Phase 2 | 🔜 Next | Review pipeline – fetch, CSV upload, PII removal, cleaning |
| Phase 3 | 🔜 | AI analysis – Groq theme extraction, sentiment, dashboard |
| Phase 4 | 🔜 | Discovery agent – preference form, recommendations, quick actions |
| Phase 5 | 🔜 | Polish, testing, deployment, documentation |

---

## Phase 1 Acceptance Criteria

- [x] `GET /api/health` responds 200 in < 100 ms
- [x] Frontend connects to backend without CORS errors
- [x] All 4 pages render: `/`, `/reviews`, `/dashboard`, `/discovery`, `/about`
- [x] Environment variables documented in `.env.example` files
- [x] Error boundary component in place
- [x] API client utility (`lib/api.ts`) ready for Phase 2
- [x] Logger and error handler middleware in place
