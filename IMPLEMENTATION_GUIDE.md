# Gaana Discovery AI - Implementation Guide

## Table of Contents
1. Project Setup
2. Groq API Integration
3. Phase-by-Phase Implementation
4. Code Examples & Snippets
5. Deployment Instructions
6. Testing & Validation

---

## 1. Project Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ (optional, if using FastAPI)
- Git and GitHub account
- Groq API key (sign up at https://console.groq.com)
- Vercel account
- Railway account

### Repository Structure
```
Gaana_Nextleap/
├── ARCHITECTURE_5_PHASE_PLAN.md
├── IMPLEMENTATION_GUIDE.md
├── problemstatementbrief.md
├── phase1/
├── phase2/
└── phase3/
    ├── backend/                 # Express backend for scraping and analysis
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── src/
    │   │   ├── app.ts
    │   │   ├── server.ts
    │   │   ├── middleware/
    │   │   ├── routes/
    │   │   ├── scrapers/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── utils/
    │   └── .env.example
    ├── main-frontend/           # Main phase 3 frontend app
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── next.config.js
    │   ├── app/
    │   │   ├── page.tsx
    │   │   ├── reviews/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── discovery/page.tsx
    │   │   └── about/page.tsx
    │   ├── lib/
    │   │   └── api.ts
    │   └── .env.example
    └── scraper-frontend/        # Optional review scraping utility UI
        ├── package.json
        ├── tsconfig.json
        ├── next.config.js
        ├── app/
        │   ├── page.tsx
        │   ├── reviews/page.tsx
        │   ├── dashboard/page.tsx
        │   ├── discovery/page.tsx
        │   └── about/page.tsx
        ├── lib/
        │   └── api.ts
        └── .env.example
```

## Current Repo Status
This repository is currently centered on the Phase 3 review discovery engine and analysis stack.

**Current implementation:**
- `phase3/backend` provides review scraping, cleaning, PII removal, and Groq analysis support
- `phase3/main-frontend` is the current main app scaffold with review scraping and discovery pages
- `phase3/scraper-frontend` is an optional standalone scraper UI, not required for the main product deployment

**Remaining work for full graduation submission:**
- Build `/api/discovery-agent` and wire it into the `phase3/main-frontend` Discovery page
- Render Groq analysis results on `/dashboard`
- Capture user interviews and research validation artifacts
- Polish deployment and production documentation

### Current deployment configuration
- Backend: Render service using `phase3/backend`
- Main frontend: Vercel project using `phase3/main-frontend`
- Use `NEXT_PUBLIC_BACKEND_URL` in Vercel to point to Render backend
- `phase3/scraper-frontend` may be deployed separately if needed, but it is not required for the main product


### Initial Setup Commands

```bash
# Create project directory
mkdir gaana-discovery-ai
cd gaana-discovery-ai

# Initialize Git
git init
git branch -m main

# Create frontend
npx create-next-app@latest frontend --typescript --tailwind --eslint

# Create backend
mkdir backend
cd backend
npm init -y
npm install express cors dotenv typescript ts-node @types/express @types/node

# Create root .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.env.*.local
dist/
build/
.next/
.DS_Store
*.log
EOF

# Create .env.example files
cat > frontend/.env.example << 'EOF'
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
EOF

cat > backend/.env.example << 'EOF'
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
GOOGLE_PLAY_APP_ID=com.gaana
EOF
```

---

## 2. Groq API Integration

### Groq API Setup

1. **Create Groq Account:**
   - Visit https://console.groq.com
   - Sign up with email or GitHub
   - Navigate to API Keys section
   - Create new API key
   - Store securely in environment variable

2. **Groq API Features:**
   - Fast LLM inference (llama-2-70b-chat)
   - Suitable for real-time analysis
   - Token limits per request
   - Rate limiting (depends on plan)

### Groq Service Implementation

**File: `backend/services/groqService.ts`**

```typescript
import Groq from "groq-sdk";

class GroqService {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async analyzeReviews(reviews: any[]): Promise<any> {
    const reviewText = reviews
      .map((r) => `Title: ${r.review_title}\nText: ${r.review_text}`)
      .join("\n\n");

    const prompt = `Analyze these user reviews and extract insights:

${reviewText}

Please provide a JSON response with:
1. themes: Array of max 5 themes {theme_name, count, description, pain_point, representative_quotes: [3-5 quotes], opportunity}
2. sentiment_summary: {positive: percentage, neutral: percentage, negative: percentage}
3. target_user_segment: Brief description of target users
4. problem_statement: 2-3 sentence problem statement
5. business_opportunity: How to address the pain points

Format your response as valid JSON.`;

    const response = await this.client.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async generateRecommendations(preferences: any): Promise<any> {
    const prompt = `Generate music recommendations based on these preferences:

Mood: ${preferences.mood}
Language: ${preferences.language}
Activity: ${preferences.activity}
Freshness: ${preferences.freshness}
Reference: ${preferences.reference}
Avoid: ${preferences.avoid.join(", ")}

Please provide 8-10 recommendations as a JSON array with each item containing:
- title: Song/artist name
- artist_or_type: Artist name or playlist type
- language_mood_fit: How it fits the language and mood
- why_this_fits: Specific reasoning
- how_fresh_this_is: Freshness assessment
- freshness_label: Safe/Balanced/Fresh
- avoids_repeating: What it avoids

Format as valid JSON array.`;

    const response = await this.client.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }
}

export default new GroqService();
```

---

## 3. Phase-by-Phase Implementation

### Phase 1: Foundation & Core Infrastructure

**Step 1.1: Backend Health Endpoint**

File: `backend/routes/health.ts`

```typescript
import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Gaana Discovery AI backend is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

**Step 1.2: Express App Setup**

File: `backend/app.ts`

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: false,
  })
);
app.use(express.json());

// Routes
app.use("/api", healthRoutes);

// Error handling
app.use(errorHandler);

export default app;
```

**Step 1.3: Frontend Home Page**

File: `frontend/app/page.tsx`

```typescript
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`
      );
      if (response.ok) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("error");
      }
    } catch (error) {
      setBackendStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Gaana Discovery AI</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover fresh but relevant music based on your mood, language,
            activity, and freshness preference.
          </p>

          <div className="bg-white/10 backdrop-blur p-8 rounded-lg mb-8">
            <p className="mb-6">
              <strong>The Flow:</strong> Public reviews → AI analysis → User
              pain points → AI-native discovery MVP
            </p>
            <p className="text-sm">
              Backend Status:{" "}
              {backendStatus === "connected" ? (
                <span className="text-green-400">✓ Connected</span>
              ) : (
                <span className="text-red-400">✗ Disconnected</span>
              )}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/reviews"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"
            >
              Analyze Reviews
            </Link>
            <Link
              href="/discovery"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold"
            >
              Try Discovery Agent
            </Link>
          </div>

          <div className="mt-12 text-sm">
            <Link href="/about" className="text-blue-200 hover:text-white">
              View Limitations & Scope
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 1.4: CORS Middleware**

File: `backend/middleware/cors.ts`

```typescript
import { Request, Response, NextFunction } from "express";

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const allowedOrigins = (process.env.FRONTEND_URL || "").split(",");

  if (allowedOrigins.includes(req.headers.origin || "")) {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "");
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "false");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};
```

**Step 1.5: Error Handler Middleware**

File: `backend/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err.message);

  const status = err.status || 500;
  const message =
    err.message ||
    "An unexpected error occurred. Please try again later.";

  res.status(status).json({
    error_code: err.code || "INTERNAL_ERROR",
    error_message: message,
    error_details: process.env.NODE_ENV === "development" ? err.stack : null,
  });
}
```

---

## 4. Phase 2: Review Data Pipeline

### Phase 2 Implementation

**Step 2.1: PII Remover Service**

File: `backend/services/piiRemover.ts`

```typescript
class PiiRemover {
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private phoneRegex = /(\+?\d{1,3}[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  private idRegex = /\b[A-Z0-9]{8,}\b/g;
  private usernameRegex = /@[\w]+/g;

  removePii(text: string): { cleaned: string; foundPii: boolean } {
    let cleaned = text;
    let foundPii = false;

    if (this.emailRegex.test(cleaned)) {
      cleaned = cleaned.replace(this.emailRegex, "[EMAIL]");
      foundPii = true;
    }

    if (this.phoneRegex.test(cleaned)) {
      cleaned = cleaned.replace(this.phoneRegex, "[PHONE]");
      foundPii = true;
    }

    if (this.usernameRegex.test(cleaned)) {
      cleaned = cleaned.replace(this.usernameRegex, "[USERNAME]");
      foundPii = true;
    }

    return { cleaned, foundPii };
  }

  validateReview(text: string): boolean {
    return text && text.trim().length > 0;
  }
}

export default new PiiRemover();
```

**Step 2.2: Review Processor Service**

File: `backend/services/reviewProcessor.ts`

```typescript
import piiRemover from "./piiRemover";

class ReviewProcessor {
  cleanReviews(reviews: any[]): any[] {
    const seen = new Set<string>();
    const cleaned = [];

    for (const review of reviews) {
      // Remove empty reviews
      if (
        !piiRemover.validateReview(review.review_text)
      ) {
        continue;
      }

      // Remove duplicates
      const hash = this.hash(review.review_text);
      if (seen.has(hash)) {
        continue;
      }
      seen.add(hash);

      // Remove PII
      const { cleaned: cleanedText } = piiRemover.removePii(
        review.review_text
      );

      // Skip if becomes empty after cleaning
      if (!cleanedText || cleanedText.trim().length === 0) {
        continue;
      }

      cleaned.push({
        ...review,
        review_text: cleanedText,
        cleaned_text: cleanedText,
        cleaning_applied: ["pii_removed", "duplicate_check"],
      });
    }

    return cleaned;
  }

  filterByDateRange(
    reviews: any[],
    fromDate: Date,
    toDate: Date
  ): any[] {
    return reviews.filter((r) => {
      const reviewDate = new Date(r.review_date);
      return reviewDate >= fromDate && reviewDate <= toDate;
    });
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

export default new ReviewProcessor();
```

**Step 2.3: Fetch Reviews Endpoint**

File: `backend/routes/reviews.ts`

```typescript
import { Router, Request, Response } from "express";
import reviewProcessor from "../services/reviewProcessor";

const router = Router();

router.post("/fetch-reviews", async (req: Request, res: Response) => {
  try {
    const { appId, fromDate, toDate, count } = req.body;

    // Validate input
    if (!appId || !fromDate || !toDate || !count) {
      return res.status(400).json({
        error_code: "INVALID_INPUT",
        error_message:
          "Missing required fields: appId, fromDate, toDate, count",
      });
    }

    if (count < 50 || count > 500) {
      return res.status(400).json({
        error_code: "INVALID_COUNT",
        error_message: "Review count must be between 50 and 500",
      });
    }

    // TODO: Implement Google Play scraping
    // For now, return mock data
    const mockReviews = generateMockReviews(count);

    res.json({
      success: true,
      reviews_fetched: mockReviews.length,
      reviews: mockReviews,
      message: `Successfully fetched ${mockReviews.length} reviews`,
    });
  } catch (error) {
    res.status(500).json({
      error_code: "FETCH_ERROR",
      error_message:
        "Failed to fetch reviews. Try uploading CSV as fallback.",
      error_details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/upload-csv", async (req: Request, res: Response) => {
  try {
    // TODO: Implement CSV parsing
    res.json({
      success: true,
      message: "CSV uploaded successfully",
    });
  } catch (error) {
    res.status(400).json({
      error_code: "CSV_ERROR",
      error_message: "Failed to parse CSV file",
    });
  }
});

function generateMockReviews(count: number) {
  const mockReviews = [
    {
      source: "Google Play Store",
      rating: 3,
      review_title: "Same songs again",
      review_text:
        "I keep hearing the same playlists. Would love fresh recommendations.",
      review_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      source_url: "https://play.google.com/store/apps/details?id=com.gaana",
    },
    {
      source: "Google Play Store",
      rating: 2,
      review_title: "Recommendations not contextual",
      review_text:
        "The app doesn't understand I want gym music. Same songs for every activity.",
      review_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      source_url: "https://play.google.com/store/apps/details?id=com.gaana",
    },
    {
      source: "Google Play Store",
      rating: 3,
      review_title: "Too mainstream",
      review_text:
        "Everything recommended is viral. I want underrated regional artists.",
      review_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      source_url: "https://play.google.com/store/apps/details?id=com.gaana",
    },
  ];

  return Array(Math.floor(count / 3))
    .fill(null)
    .flatMap(() => mockReviews);
}

export default router;
```

