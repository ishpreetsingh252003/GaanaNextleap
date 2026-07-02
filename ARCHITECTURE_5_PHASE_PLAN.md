# Gaana Discovery AI - 5 Phase Architecture Plan

## Executive Summary

This document outlines a phased approach to building and deploying Gaana Discovery AI, a full-stack product consisting of two connected modules: an AI Review Discovery Engine and an AI Music Discovery Agent. The project spans 5 implementation phases over approximately 4-6 weeks, delivering working functionality progressively while maintaining deployment readiness at each phase.

**Technology Stack:**
- Frontend: Next.js + React (Vercel deployment)
- Backend: Node.js/Express (Render deployment)
- AI Engine: Groq API (review analysis & music discovery)
- Data: CSV + Google Play reviews (public sources)
- Infrastructure: Vercel + Render + GitHub

---

## Current Status
This project is currently in Phase 3 of the planned roadmap.

**Completed:**
- Phase 1 foundation and API scaffolding
- Phase 2 review scrapers, cleaning, and multi-source data ingestion
- Phase 3 review analysis backend scaffolding and frontend page scaffolds

**Current repo structure:**
- `phase3/backend` — backend API, scraper orchestration, Groq analysis service
- `phase3/main-frontend` — main app UI scaffold for review flow and discovery screen
- `phase3/scraper-frontend` — optional standalone scraper utility UI

**Deployment reality:**
- Backend should be deployed on Render as `phase3/backend`
- Main frontend should be deployed on Vercel from `phase3/main-frontend`
- `phase3/scraper-frontend` is not required for the main product deployment

**Pending work:**
- Wire the dashboard to actual Groq analysis results
- Build and deploy the Phase 4 Discovery Agent MVP
- Add user research / interview validation documentation
- Finalize production polish, error handling, and submission documentation

---

## Phase 1: Foundation & Core Infrastructure (Week 1)

### Objectives
- Establish backend API structure with health checks
- Create frontend scaffold with Next.js routing
- Set up deployment pipelines on Vercel and Railway
- Establish environment variable management
- Verify cross-origin communication (CORS)

### Deliverables

**Backend Components:**
- Node.js/Express server initialization
- GET /health endpoint (returns status "ok")
- CORS middleware configuration
- Environment variable loader (.env support)
- Error handling middleware (consistent error responses)
- Request logging middleware (sanitized, no PII)
- Railway deployment configuration (.railway or Procfile)

**Frontend Components:**
- Next.js project initialization with TypeScript support
- Base page layout structure (header, nav, footer)
- Routing scaffolds: /home, /reviews, /discovery, /about
- Environment variable configuration (NEXT_PUBLIC_BACKEND_URL)
- API client utility for calling backend
- Basic error boundary component
- Vercel deployment configuration (next.config.js)

**Infrastructure:**
- GitHub repository setup with .gitignore
- README.md with project overview
- .env.example files (frontend & backend)
- GitHub Actions or manual deployment guides
- CORS whitelist configured for Vercel URL

### Key Technical Decisions
- **Framework Choice**: Express (simpler than Fastapi for quick deployment)
- **Database Strategy**: No persistent database in Phase 1; reviews stored in-memory during session
- **Authentication**: None required (public demonstration)
- **API Design**: RESTful with JSON payloads

### Acceptance Criteria
- [ ] Backend /health endpoint responds with 200 status in <100ms
- [ ] Frontend connects to backend without CORS errors
- [ ] Both deployed on Vercel and Railway with public URLs
- [ ] Environment variables correctly configured in both platforms
- [ ] README includes setup instructions for local development

---

## Phase 2: Review Data Pipeline (Week 1-2)

### Objectives
- Implement review data ingestion from Google Play Store
- Build CSV upload fallback mechanism
- Implement data validation and cleaning pipeline
- Remove PII from review content
- Store and prepare data for AI analysis

### Deliverables

**Backend Components:**
- POST /api/fetch-reviews endpoint
  - Input: appId, fromDate, toDate, count
  - Calls Google Play reviews API (or scraper library)
  - Normalizes to standard review schema
  - Filters reviews by date range (Jan 1, 2026 - today)
  - Returns error suggestions if fetching fails
  
- POST /api/upload-csv endpoint
  - Accepts multipart CSV file upload (max 5MB)
  - Validates CSV format and required columns
  - Parses and normalizes date formats
  - Returns validation errors if malformed
  - Merges CSV data with in-memory store

- Review Data Cleaner (internal utility)
  - Remove empty/null reviews
  - Remove exact duplicates (by review_text hash)
  - Detect and mask PII: emails, phone numbers, usernames, IDs
  - Remove reviews that become empty after cleaning
  - Add cleaned_text field to review object
  - Preserve audit trail (logging only, no storage)

- Helper functions:
  - Date range validator (ensures Jan 1, 2026 - today)
  - CSV validator (checks columns, file size)
  - PII detector (regex patterns for common PII)
  - Review normalizer (standardizes field names and types)

**Frontend Components:**
- Review Engine page (/reviews)
  - Form inputs:
    - appId field (pre-filled "com.gaana", editable)
    - fromDate picker (default: Jan 1, 2026)
    - toDate picker (default: today)
    - count number input (50-500, default 300)
  - "Fetch Reviews" button → calls /api/fetch-reviews
  - Error handling with CSV fallback suggestion
  - CSV file upload input with drag-and-drop support
  - Loading states during fetching/uploading
  - Success confirmation with review count
  - "Proceed to Analysis" button

**Data Schema:**
```javascript
{
  source: "Google Play Store" | "CSV Upload",
  rating: 1-5,
  review_title: string,
  review_text: string (cleaned),
  review_date: "2026-01-15T00:00:00Z",
  source_url: string | null,
  cleaned_text: string (for audit),
  cleaning_applied: ["pii_removed", "duplicate_check", "empty_text_removed"]
}
```

### Key Technical Decisions
- **Review Fetching**: Use google-play-scraper npm package as primary, with fallback error handling
- **PII Detection**: Regex-based pattern matching (email, phone, ID patterns)
- **Data Storage**: In-memory array per session (cleared on refresh)
- **Batch Processing**: Handle up to 500 reviews without performance degradation

### Acceptance Criteria
- [ ] /api/fetch-reviews returns 300 Google Play reviews within 20 seconds
- [ ] CSV upload correctly validates format and reports specific errors
- [ ] PII removal masks at least 95% of common PII patterns
- [ ] Review Engine UI displays loading state and success confirmation
- [ ] Date filtering correctly includes Jan 1, 2026 through today
- [ ] Error messages suggest fallback options (CSV upload)
- [ ] Cleaned reviews ready for AI analysis

---

## Phase 3: AI Review Analysis Engine (Week 2-3)

### Objectives
- Integrate Groq API for review analysis
- Extract themes from review data using AI
- Generate AI problem statement and target segment
- Implement sentiment analysis
- Create Review Dashboard UI to display results

### Deliverables

**Backend Components:**
- POST /api/analyze-reviews endpoint
  - Input: cleaned review array
  - Calls Groq API with review batch
  - Groq prompt: Extract 5 themes, sentiment, quotes, pain points
  - Groups reviews into maximum 5 themes
  - Extracts 3-5 representative quotes per theme
  - Generates problem statement (2-3 sentences)
  - Generates target user segment description
  - Generates business opportunity summary
  - Returns structured analysis JSON

- Analysis Engine (Groq integration)
  - Initialize Groq client with API key
  - Batch reviews into chunks (avoid token limit)
  - Construct analysis prompt with review data
  - Parse Groq response into structured format
  - Validate completeness of response
  - Handle rate limits with exponential backoff
  - Handle API failures gracefully

- Response Structure:
```javascript
{
  summary: "Overall summary of findings",
  total_reviews_analyzed: 300,
  date_range: "2026-01-01 to 2026-06-22",
  sources: ["Google Play Store"],
  themes: [
    {
      theme_name: "Repetitive Recommendations",
      count: 87,
      description: "Users report receiving same songs/artists repeatedly",
      pain_point: "Playlist fatigue; lack of fresh discovery",
      representative_quotes: ["Quote 1", "Quote 2", "Quote 3"],
      opportunity: "Implement mood/context-aware discovery"
    },
    // ... up to 5 themes
  ],
  sentiment_summary: {
    positive: "15%",
    neutral: "40%",
    negative: "45%"
  },
  target_user_segment: "Young Indian listeners 18-30 who repeat familiar playlists...",
  problem_statement: "Users want fresh but relevant music...",
  business_opportunity: "Gaana can improve retention by..."
}
```

**Frontend Components:**
- Review Dashboard page (/dashboard)
  - Display summary metrics:
    - Total reviews analyzed
    - Date range
    - Review source(s)
    - Analysis timestamp
  
  - Display themes section:
    - Up to 5 theme cards
    - Theme name, count, percentage, description
    - Visual indicator for theme importance
  
  - Display sentiment summary:
    - Positive/neutral/negative percentages
    - Visual progress bars or pie chart
  
  - Display quotes section:
    - 3-5 real user quotes
    - Source attribution
    - Clear formatting
  
  - Display insights section:
    - Key pain points (bulleted list)
    - User behavior insights
    - Opportunity areas
    - Labeled as "AI-Generated Insights"
  
  - Display opportunity summary:
    - Generated business opportunity text
    - CTA to "Try Discovery Agent" button

- Navigation:
  - Back button to Review Engine
  - Forward button to Discovery Agent
  - Preserve analysis results in session state

### Key Technical Decisions
- **Groq Model**: Use llama-2-70b-chat (fast, good for analysis)
- **Prompt Strategy**: Provide clear structure for theme extraction
- **Error Recovery**: Retry failed API calls with exponential backoff (3 retries max)
- **Token Optimization**: Summarize reviews if batch too large for single request

### Acceptance Criteria
- [ ] /api/analyze-reviews completes within 45 seconds for 300 reviews
- [ ] Groq API successfully extracts 3-5 themes from reviews
- [ ] Problem statement generated and is specific to review data
- [ ] Sentiment analysis percentages sum to 100%
- [ ] Review Dashboard displays all analysis results correctly
- [ ] No Groq API errors exposed to frontend user
- [ ] Analysis results available for Review Dashboard display

---

## Phase 4: Music Discovery Agent (Week 3-4)

### Objectives
- Build Discovery Agent preference form
- Implement natural language preference parsing
- Create Groq-powered recommendation engine
- Build quick action buttons for iterative refinement
- Create intuitive recommendation display UI

### Deliverables

**Backend Components:**
- POST /api/discovery-agent endpoint
  - Input:
    ```javascript
    {
      mood: "Chill" | "Sad" | "Party" | "Gym" | "Travel" | "Focus" | "Romantic" | "Energetic",
      language: "Hindi" | "Punjabi" | "Tamil" | "Telugu" | "Bhojpuri" | "English" | "Mixed",
      activity: "Studying" | "Travelling" | "Gym" | "Late night" | "Party" | "Work" | "Relaxing",
      freshness: "Safe" | "Balanced" | "Fresh",
      reference: "string (artist, song, or natural language)",
      avoid: ["avoid_repeated_artists", "avoid_mainstream", "avoid_overplayed", "avoid_sad", "avoid_slow"]
    }
    ```
  
  - Processing:
    - Parse natural language reference if provided
    - Extract mood, activity, language nuances from reference
    - Construct discovery prompt for Groq API
    - Call Groq API with all preferences
    - Generate 8-10 recommendations with explanations
    - Validate recommendation completeness
    - Return structured results

- Discovery Generation (Groq integration)
  - Initialize Groq client
  - Construct comprehensive discovery prompt including:
    - User's stated preferences (mood, language, activity)
    - Freshness preference guidance
    - Reference artist/song (if provided)
    - Avoid preferences
    - Request for 8-10 recommendations
  - Parse recommendations into structured format
  - Ensure each recommendation includes all required fields
  - Handle API failures with user-friendly error

- Response Structure:
```javascript
{
  recommendations: [
    {
      title: "Song Name",
      artist_or_type: "Artist Name / Playlist Type",
      language_mood_fit: "Why this fits the language and mood",
      why_this_fits: "Specific reasoning based on user preferences",
      how_fresh_this_is: "New release / Emerging artist / Underrated / etc",
      freshness_label: "Safe" | "Balanced" | "Fresh",
      avoids_repeating: "Not from same artist as reference / Not mainstream / etc"
    },
    // ... 8-10 recommendations
  ],
  explanation: "Overall discovery approach summary",
  query_used: "Echo of user's input for confirmation"
}
```

**Frontend Components:**
- Discovery Agent page (/discovery)
  - Form section:
    - Mood selector: 8 options as buttons
    - Language selector: 7 options as multi-select
    - Activity selector: 7 options as buttons
    - Freshness selector: 3 options as radio buttons
    - Reference input: text area (artist, song, natural language)
    - Avoid preferences: checkboxes (5 options, multiple selection)
    - "Discover" button (submit form)
  
  - Results section:
    - Display 8-10 recommendation cards with:
      - Title (large)
      - Artist/Type (secondary)
      - Language/Mood Fit (label)
      - Why This Fits (explanation)
      - Freshness Label (badge: Safe/Balanced/Fresh)
      - Avoids Repeating (additional context)
    - Quick action buttons below recommendations:
      - "More fresh" → re-query with freshness moved to Fresh
      - "More familiar" → re-query with freshness moved to Safe
      - "Change mood" → display mood selector, update and re-query
      - "More regional" → re-query with non-English language priority
      - "Avoid mainstream" → re-query with avoid_mainstream added
  
  - Loading states during generation
  - Error messages for failed generation
  - Preserve last query for context

- Session state management:
  - Store last preferences
  - Store last recommendations
  - Preserve conversation context across quick actions

### Key Technical Decisions
- **Discovery Model**: Use llama-2-70b-chat (good at reasoning about preferences)
- **Prompt Engineering**: Include examples of good discovery preferences
- **Quick Actions**: Modify minimal preference fields for iterative refinement
- **Natural Language Parsing**: Let Groq interpret nuance from reference text

### Acceptance Criteria
- [ ] /api/discovery-agent returns 8-10 recommendations within 10 seconds
- [ ] Natural language references correctly interpreted (mood, activity, freshness)
- [ ] Recommendations include all required fields
- [ ] Each recommendation includes specific reasoning (not generic)
- [ ] Freshness labels correctly reflect Safe/Balanced/Fresh
- [ ] Quick action buttons successfully regenerate recommendations
- [ ] Language preference honored in at least 80% of recommendations
- [ ] Discovery Agent UI displays all recommendations clearly
- [ ] Quick actions preserve non-modified preferences

---

## Phase 5: Polish, Testing & Deployment (Week 4-6)

### Objectives
- Build About/Limitations page
- Implement comprehensive error handling
- Create end-to-end testing workflow
- Optimize performance
- Finalize documentation
- Deploy to production (Vercel + Railway)

### Deliverables

**Frontend Components:**
- About/Limitations page (/about)
  - Prominent disclaimer:
    "This MVP uses publicly available metadata/search results or sample catalog data to demonstrate the AI-powered discovery experience. It does not represent Gaana's full internal catalog."
  - Data Sources section:
    - Explanation of public review collection
    - Notes on sample music metadata
    - Groq API inference explanation
  - Privacy & Data Protection section:
    - PII removal process explanation
    - Data retention policy (no permanent storage)
    - HTTPS/TLS data transmission
  - Project Scope section:
    - Learning/demonstration purpose clarification
    - Not production-ready clarification
    - Limitations of music catalog
    - Limitations of personalization
  - Contact/Support section (if applicable)

- Home Page refinement
  - Clear flow diagram: Reviews → Analysis → Pain Points → Discovery MVP
  - Prominent CTAs: "Analyze Reviews" and "Try Discovery Agent"
  - Problem statement summary
  - Success metric examples ("30% session duration increase")

- Error handling improvements:
  - User-friendly error messages (no technical jargon)
  - Graceful fallbacks (CSV when Play Store fails)
  - Loading state animations
  - Retry mechanisms with clear user feedback

- Performance optimization:
  - Code splitting for pages
  - Image optimization
  - API response caching where appropriate
  - Lazy loading for recommendations

- Mobile responsiveness:
  - Test on iOS Safari, Android Chrome
  - Ensure form inputs work on mobile
  - Responsive recommendation cards
  - Touch-friendly buttons

**Backend Improvements:**
- Enhanced error handling:
  - Consistent error response format
  - Descriptive error messages (no stack traces to client)
  - Rate limiting information in errors
  - Validation error specificity

- Logging and monitoring:
  - Request logging (timestamp, endpoint, response status, duration)
  - Error logging (error message, stack trace, component)
  - No sensitive data in logs (API keys, PII)
  - Railway logging integration

- Performance monitoring:
  - API response time tracking
  - Error rate monitoring
  - Groq API token usage tracking
  - Database/memory usage if applicable

- Security hardening:
  - Input validation on all endpoints
  - CORS strictly configured
  - API key never exposed in responses
  - Rate limiting if deployed publicly

**Documentation:**
- README.md comprehensive guide:
  - Project overview and problem statement
  - Tech stack summary
  - Architecture diagram/description
  - Local development setup (10 minutes to first run)
  - Environment variables guide (.env.example)
  - Frontend setup and deployment steps
  - Backend setup and deployment steps
  - Deployment to Vercel (step-by-step)
  - Deployment to Railway (step-by-step)
  - API endpoints documentation
  - Known limitations and future improvements
  - Demo flow walkthrough
  - Troubleshooting guide

- Code documentation:
  - JSDoc comments on major functions
  - Component prop documentation
  - API endpoint documentation in comments
  - Complex algorithm explanations

- .env.example files:
  - Backend: GROQ_API_KEY, PORT, FRONTEND_URL
  - Frontend: NEXT_PUBLIC_BACKEND_URL

**Testing & QA:**
- Manual end-to-end workflow:
  1. Home page loads successfully
  2. Navigate to Review Engine
  3. Fetch reviews (or upload CSV)
  4. Analyze reviews successfully
  5. View Review Dashboard with all metrics
  6. Navigate to Discovery Agent
  7. Enter discovery preferences
  8. Generate recommendations
  9. Click quick action buttons (verify re-generation)
  10. Navigate to About page and verify disclaimers

- Performance testing:
  - Review analysis with 300 reviews completes <45 seconds
  - Discovery generation completes <10 seconds
  - Page loads complete <2 seconds
  - API responses (95th percentile) <5 seconds

- Error path testing:
  - Google Play fetch failure → CSV fallback suggestion
  - Groq API failure → user-friendly error
  - Network interruption → retry with backoff
  - Invalid form input → validation errors

- Browser compatibility:
  - Chrome (latest 2 versions)
  - Safari (latest 2 versions)
  - Firefox (latest 2 versions)
  - Mobile browsers (iOS Safari, Chrome)

- Accessibility testing:
  - Color contrast meets WCAG AA standard
  - Keyboard navigation works
  - Alt text on images
  - Form labels associated correctly
  - Error messages descriptive

**Deployment Configuration:**
- Vercel:
  - Deploy from GitHub main branch
  - Set NEXT_PUBLIC_BACKEND_URL to Railway backend URL
  - Configure domain/custom domain if applicable
  - Enable analytics and monitoring
  - Set up preview deployments for PRs

- Railway:
  - Deploy from GitHub main branch
  - Configure environment variables: GROQ_API_KEY, PORT, FRONTEND_URL
  - Enable health checks pointing to /health endpoint
  - Configure restart policies
  - Enable logs and monitoring

- GitHub:
  - Merge all phase 1-4 work to main branch
  - Tag release version (v0.1.0 MVP)
  - Create deployment documentation
  - Document setup for contributors

### Key Technical Decisions
- **Release Strategy**: v0.1.0 MVP with known limitations documented
- **Monitoring**: Use Vercel and Railway built-in monitoring
- **Scaling**: Document future scaling needs (persistent DB, caching, CDN)

### Acceptance Criteria
- [ ] All pages render without console errors
- [ ] End-to-end workflow completes successfully
- [ ] Review analysis completes within 45 seconds (300 reviews)
- [ ] Discovery generation completes within 10 seconds
- [ ] All page loads complete within 2 seconds
- [ ] Error handling displays user-friendly messages
- [ ] CORS working between Vercel and Railway
- [ ] Environment variables correctly configured on both platforms
- [ ] README provides complete setup and deployment guide
- [ ] About page includes all required disclaimers
- [ ] Deployed successfully on Vercel (accessible via URL)
- [ ] Deployed successfully on Railway (API endpoints accessible)
- [ ] No sensitive data exposed in logs or error messages
- [ ] Mobile responsive on iOS and Android
- [ ] Keyboard navigation works on all pages

---

## Cross-Cutting Concerns

### Environment Variable Management

**Backend (.env):**
```
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
FRONTEND_URL=https://gaana-discovery-ai.vercel.app
NODE_ENV=production
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_BACKEND_URL=https://gaana-discovery-backend.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### Error Handling Strategy
- All API errors return consistent JSON: `{ error_code, error_message, error_details }`
- Frontend catches errors and displays user-friendly messages
- No technical errors or stack traces exposed to users
- Logging captures technical details for debugging

### CORS Configuration
- Backend allows requests from Vercel frontend URL only
- Credentials not required (public API)
- Allow methods: GET, POST, OPTIONS
- Allow headers: Content-Type, Accept

### Performance Targets
- /health endpoint: <100ms response
- Review analysis (300 reviews): <45 seconds
- Discovery generation: <10 seconds
- Page load: <2 seconds
- API response (95th percentile): <5 seconds

### Data Privacy & Security
- PII removed from reviews before analysis
- API keys stored in environment variables only
- HTTPS/TLS for all communications
- No personal listening data collected
- No persistent user tracking

### Scalability Considerations (Future)
- Add database layer (PostgreSQL) for persistent storage
- Implement caching layer (Redis) for repeated queries
- Add CDN for frontend assets
- Implement rate limiting for API endpoints
- Add authentication for admin/moderator functions

---

## Phase Timeline & Resource Allocation

| Phase | Duration | Key Activities | Team Size |
|-------|----------|------------------|-----------|
| Phase 1 | Week 1 | Backend setup, frontend scaffold, deployments | 1-2 dev |
| Phase 2 | Week 1-2 | Review pipeline, data cleaning, validation | 1-2 dev |
| Phase 3 | Week 2-3 | Groq integration, analysis engine, dashboard | 1-2 dev |
| Phase 4 | Week 3-4 | Discovery agent, quick actions, refinement | 1-2 dev |
| Phase 5 | Week 4-6 | Polish, testing, optimization, documentation | 1-2 dev + QA |

**Estimated Total:** 4-6 weeks, 1-2 developers

---

## Success Criteria

### Functional Completeness
- ✅ All 5 pages functional and deployed
- ✅ Review pipeline end-to-end working
- ✅ AI analysis generating themes and insights
- ✅ Discovery agent generating recommendations
- ✅ Quick actions successfully refining results
- ✅ Proper error handling throughout

### Non-Functional Requirements
- ✅ Performance targets met (response times)
- ✅ Deployed on Vercel and Railway with public URLs
- ✅ Environment variables properly configured
- ✅ CORS working correctly
- ✅ No sensitive data exposed
- ✅ Mobile responsive
- ✅ Graceful error handling

### Documentation & Learning
- ✅ Comprehensive README with setup and deployment
- ✅ Clear explanation of product thinking flow
- ✅ About/Limitations page with proper disclaimers
- ✅ Code well-commented and documented
- ✅ Demo flow executable and demonstrable

### Demo Readiness
- ✅ Live deployment ready for presentation
- ✅ End-to-end flow works smoothly
- ✅ Error cases handled gracefully
- ✅ Loading states clear to user
- ✅ Results display clearly and professionally

---

## Known Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Google Play scraping fails | Medium | High | CSV fallback mechanism built in Phase 2 |
| Groq API rate limits | Low | Medium | Implement batch processing and retry logic |
| CORS issues between Vercel/Railway | Low | High | CORS tested thoroughly in Phase 1 |
| Performance degradation at scale | Low | Medium | Monitor response times, optimize in Phase 5 |
| PII removal incomplete | Low | High | Regex patterns reviewed, audit logging enabled |
| Recommendation quality poor | Medium | Medium | Iteratively refine Groq prompts based on testing |

---

## Next Steps

1. **Immediate (Today):** Review and approve this 5-phase architecture plan
2. **Phase 1 Start:** Set up GitHub repo, initialize Express and Next.js projects
3. **Weekly Reviews:** Check progress against acceptance criteria
4. **Post-Phase Sync:** Review deliverables before moving to next phase
5. **Phase 5 Completion:** Deploy to production and schedule demo

---

## Appendix: API Endpoint Reference

### Backend Endpoints (Phase-by-phase)

**Phase 1:**
- GET /health

**Phase 2:**
- POST /api/fetch-reviews
- POST /api/upload-csv

**Phase 3:**
- POST /api/analyze-reviews

**Phase 4:**
- POST /api/discovery-agent

### Frontend Pages (Phase-by-phase)

**Phase 1:**
- / (Home)
- /about (About/Limitations - basic)

**Phase 2:**
- /reviews (Review Engine)

**Phase 3:**
- /dashboard (Review Dashboard)

**Phase 4:**
- /discovery (Discovery Agent)

**Phase 5:**
- All pages polished and finalized
- /about enhanced with full content
