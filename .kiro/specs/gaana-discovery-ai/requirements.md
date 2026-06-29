# Gaana Discovery AI - Requirements Document

## Introduction

Gaana Discovery AI is a full-stack deployed product that empowers young Indian music listeners (18-30) to discover fresh but relevant music. The system consists of two connected modules: an AI Review Discovery Engine that analyzes public Google Play reviews to identify user pain points, and an AI Music Discovery Agent that helps users find new music based on mood, language, activity, and freshness preference. This document defines the functional, non-functional, data, integration, and deployment requirements for the complete system.

## Glossary

- **System**: The complete Gaana Discovery AI application including frontend, backend, and AI services
- **Review_Discovery_Engine**: The backend module that fetches, analyzes, and extracts insights from public reviews
- **Discovery_Agent**: The AI-powered music recommendation system that generates personalized suggestions
- **Gaana_App**: The music streaming application with app ID com.gaana
- **User**: Young Indian music listener aged 18-30 who uses music streaming services
- **Theme**: A grouped category of review feedback extracted by AI analysis (e.g., "Repetitive Recommendations")
- **Pain_Point**: A specific user friction or challenge identified from review analysis
- **Freshness_Preference**: User's desired level of novelty in recommendations (Safe, Balanced, Fresh)
- **Mood**: Emotional or activity-based listening context (Chill, Sad, Party, Gym, etc.)
- **PII**: Personally Identifiable Information (emails, phone numbers, usernames, user IDs)
- **Groq_API**: The AI inference service used for review analysis and discovery agent reasoning
- **Railway**: Backend deployment platform
- **Vercel**: Frontend deployment platform

## User Personas

### Persona 1: Repetitive Listener
- **Name**: Arjun, 24, Delhi
- **Profile**: Works in tech, listens to music while working and commuting
- **Problem**: Relies on 5-6 playlists repeatedly; wants fresh recommendations but struggles to discover new artists
- **Needs**: Easy discovery of new songs that match current mood without effort; control over freshness level
- **Music Taste**: Hindi, Punjabi, English mix; likes rap and indie

### Persona 2: Context-Aware Listener
- **Name**: Priya, 22, Bangalore
- **Profile**: Student who listens across different activities (studying, gym, late night)
- **Problem**: Current recommendations don't match activity context; system recommends same songs regardless of activity
- **Needs**: Mood and activity-aware recommendations that change with context
- **Music Taste**: Tamil, Telugu, Hindi; likes classical fusion and dance music

### Persona 3: Regional Discovery Seeker
- **Name**: Karan, 26, Mumbai
- **Profile**: Marketing professional interested in regional music but finds mostly mainstream content
- **Problem**: Discovery is biased towards popular/viral songs; hard to find underrated regional artists
- **Needs**: Access to fresh regional music with control over mainstream vs underrated preference
- **Music Taste**: Marathi, Punjabi regional; discovers music through Instagram and YouTube

## Business Objectives and Success Metrics

### Objectives
1. Increase meaningful music discovery on Gaana by helping users find fresh but relevant songs
2. Reduce playlist fatigue and repetitive listening behavior
3. Improve user retention through better personalization and discovery experience
4. Enable users to discover new artists and underrated songs they wouldn't find through traditional recommendations

### Success Metrics
- Session duration: Increase by 15% when users access Discovery Agent
- Save/add-to-playlist behavior: Increase fresh song additions by 20%
- New artist discovery: Increase unique artists played per user by 25%
- User retention: Reduce churn among active users by 10%
- Feature adoption: Achieve 30% of target segment users trying Discovery Agent within 3 months
- User satisfaction: Achieve 4.2+ rating for Discovery Agent relevance in user feedback


## Requirements

### Requirement 1: Review Data Ingestion

**User Story:** As a product analyst, I want to collect public reviews from Gaana app users, so that I can understand user pain points and validate discovery problems.

#### Acceptance Criteria

1. WHEN the Review_Engine receives a fetch request with appId "com.gaana", date range, and count parameter, THE System SHALL retrieve public reviews from Google Play Store within the specified date range
2. WHEN the System retrieves reviews successfully, THE System SHALL normalize all reviews to include: source, rating (1-5), review_title, review_text, review_date (ISO 8601), source_url
3. WHEN Google Play review fetching fails, THE System SHALL return a descriptive error message and suggest CSV upload as fallback without crashing
4. WHEN a User uploads a CSV file with columns (source, rating, review_title, review_text, review_date, source_url), THE System SHALL parse and validate the CSV format
5. IF the CSV file contains invalid or missing required columns, THEN THE System SHALL return validation errors with specific column names
6. WHEN CSV data is valid, THE System SHALL normalize dates to ISO 8601 format and store the data for analysis
7. WHEN reviews are fetched or uploaded, THE System SHALL filter to include only reviews dated between January 1, 2026 and today's date
8. WHEN review data exceeds 1000 reviews, THE System SHALL handle batching to prevent memory overflow during processing

### Requirement 2: Review Data Cleaning and PII Removal

**User Story:** As a data privacy officer, I want user reviews to be cleaned of personal information, so that the system respects user privacy and complies with data protection standards.

#### Acceptance Criteria

1. WHEN reviews are prepared for analysis, THE System SHALL remove empty or null review texts
2. WHEN reviewing review content, THE System SHALL remove exact duplicate reviews (same review_text)
3. WHEN processing review text, THE System SHALL scan for and remove PII including: email addresses, phone numbers, usernames, user IDs, and Gaana account references
4. WHEN PII is detected, THE System SHALL replace it with a placeholder token (e.g., [EMAIL], [PHONE]) to preserve review context
5. WHEN a review contains only PII or becomes empty after cleaning, THE System SHALL exclude it from analysis
6. WHEN reviews are cleaned, THE System SHALL preserve original review_text alongside cleaned_text for audit purposes (internal logging only)
7. WHILE processing large review batches, THE System SHALL apply cleaning efficiently to maintain backend response time under 30 seconds for up to 500 reviews

### Requirement 3: AI-Powered Review Analysis

**User Story:** As a product manager, I want AI to analyze user reviews and extract themes, sentiment, and pain points, so that I can understand user needs and validate the discovery problem.

#### Acceptance Criteria

1. WHEN the System analyzes cleaned review data using Groq API, THE System SHALL identify and group reviews into a maximum of 5 distinct themes
2. WHEN themes are extracted, THE System SHALL include: theme_name, count of reviews matching theme, description, pain_point identified, and opportunity area
3. WHEN analyzing reviews, THE System SHALL classify sentiment as positive, neutral, or negative for each review and provide summary percentages
4. FOR each theme identified, THE System SHALL extract 3-5 representative quotes from actual reviews that exemplify that theme
5. WHEN analyzing reviews, THE System SHALL identify key user behavior insights including: listening habits, frustrations with current recommendations, and discovery preferences
6. WHEN analyzing reviews, THE System SHALL identify opportunity areas where product improvements could address user pain points
7. WHEN Groq API returns analysis, THE System SHALL validate that theme names are specific and actionable (not generic labels like "App Issues")
8. IF Groq API fails or returns incomplete analysis, THE System SHALL return a graceful error without partial or corrupted analysis results
9. WHEN review analysis is complete, THE System SHALL organize results in a standard JSON structure for consistent dashboard rendering

### Requirement 4: AI-Generated Problem Statement and Target Segment

**User Story:** As a product strategist, I want AI to synthesize review insights into a clear problem statement and target segment, so that I can communicate user needs and justify the Discovery Agent feature.

#### Acceptance Criteria

1. WHEN review analysis is complete, THE System SHALL use Groq API to generate a concise problem statement (2-3 sentences) that articulates user pain and opportunity
2. WHEN generating the problem statement, THE System SHALL reference specific pain points and behaviors extracted from review themes
3. WHEN analyzing reviews, THE System SHALL identify and describe the target user segment including: age range, listening patterns, music preferences, and friction points
4. WHEN target segment is generated, THE System SHALL include specific, measurable characteristics (e.g., "listeners aged 18-30 who use 5+ playlists but add <5 new songs monthly")
5. WHILE generating problem statement and segment, THE System SHALL maintain logical connection to actual review data and avoid generic or unsubstantiated claims
6. WHEN analysis shows reviews insufficient to draw conclusions, THE System SHALL indicate low confidence and recommend collecting more review data

### Requirement 5: Review Dashboard Display

**User Story:** As a product analyst, I want to view a clear dashboard of review insights, so that I can understand user pain points and share findings with stakeholders.

#### Acceptance Criteria

1. WHEN the Review_Dashboard page loads, THE System SHALL display: total reviews analyzed, review source, date range analyzed, and analysis completion timestamp
2. WHEN dashboard renders, THE System SHALL show top 5 themes as cards with: theme name, review count, count as percentage of total reviews, and theme description
3. WHEN dashboard displays themes, THE System SHALL include a sentiment summary showing positive/neutral/negative percentages as visual indicators
4. WHEN dashboard renders, THE System SHALL display 3-5 real user quotes extracted from reviews, clearly attributed to review source
5. WHEN viewing the dashboard, THE System SHALL present key pain points identified in review analysis in a readable list format with explanations
6. WHEN dashboard shows insights, THE System SHALL include a generated business opportunity summary synthesizing how the Discovery Agent addresses identified pain points
7. WHEN dashboard displays AI-generated content (problem statement, target segment), THE System SHALL label it as "AI-Generated Insights" for transparency
8. WHEN a User navigates back to Review_Engine to analyze new reviews, THE System SHALL preserve previous analysis results for comparison

### Requirement 6: Discovery Agent Configuration Interface

**User Story:** As a music listener, I want to specify my music discovery preferences through an intuitive form, so that I can receive relevant recommendations without manual searching.

#### Acceptance Criteria

1. WHEN the Discovery_Agent page loads, THE System SHALL display a form with input fields for: mood, language, activity, freshness preference, reference, and avoid preferences
2. WHEN User selects mood, THE System SHALL provide options: Chill, Sad, Party, Gym, Travel, Focus, Romantic, Energetic
3. WHEN User selects language, THE System SHALL provide options: Hindi, Punjabi, Tamil, Telugu, Bhojpuri, English, Mixed
4. WHEN User selects activity, THE System SHALL provide options: Studying, Travelling, Gym, Late night, Party, Work, Relaxing
5. WHEN User selects freshness preference, THE System SHALL provide options: Safe (familiar artists/songs), Balanced (mix of new and familiar), Fresh (primarily new artists/songs)
6. WHEN User enters reference input, THE System SHALL accept: artist name, song name, playlist type, or natural language request (e.g., "Punjabi gym songs like Sidhu Moose Wala but not viral tracks")
7. WHEN User selects avoid preferences, THE System SHALL provide options: Avoid repeated artists, Avoid mainstream songs, Avoid overplayed tracks, Avoid sad songs, Avoid slow songs (multiple selections allowed)
8. WHEN User enters natural language reference, THE System SHALL parse and interpret intent including mood, activity, language, and freshness nuances from the text
9. WHEN form is complete, THE System SHALL enable a "Discover" button; form submission SHALL send all preferences to backend Discovery_Agent endpoint

### Requirement 7: AI-Powered Music Discovery Generation

**User Story:** As a music listener, I want AI to understand my discovery preferences and generate personalized, fresh recommendations, so that I can find music that matches my mood and context.

#### Acceptance Criteria

1. WHEN the Discovery_Agent endpoint receives mood, language, activity, freshness, reference, and avoid preferences, THE System SHALL use Groq API to generate 8-10 music recommendations
2. WHEN generating recommendations, THE System SHALL return each recommendation with: title/song name, artist/artist name or playlist type, language/mood fit explanation, why this recommendation fits, how fresh/novel this song is, freshness label (Safe/Balanced/Fresh), and what repeated elements it avoids
3. WHEN a User provides a natural language reference like "Punjabi gym songs like Sidhu Moose Wala but not viral tracks", THE System SHALL interpret: language (Punjabi), activity (gym), mood (high-energy implied), reference artist (Sidhu Moose Wala), and avoid preference (mainstream/viral)
4. WHEN generating recommendations, THE System SHALL weight freshness preference so Safe recommendations prioritize known artists, Balanced includes mix of established and emerging artists, and Fresh prioritizes lesser-known or new-release songs
5. WHEN generating recommendations, THE System SHALL include language preference in all suggestions; IF User selects Mixed language, THE System SHALL distribute recommendations across languages
6. WHEN generating recommendations, THE System SHALL ensure each recommendation logically connects to reference input and stated preferences
7. WHEN Groq API fails or returns incomplete recommendations, THE System SHALL return a user-friendly error message without partial results
8. WHEN recommendations are generated, THE System SHALL prepare them for rendering with all required fields populated consistently

### Requirement 8: Discovery Agent Quick Actions

**User Story:** As a music listener, I want to refine recommendations with quick actions, so that I can iteratively find music that matches my intent without re-entering all preferences.

#### Acceptance Criteria

1. WHEN recommendations are displayed, THE System SHALL render quick action buttons: "More fresh", "More familiar", "Change mood", "More regional", "Avoid mainstream"
2. WHEN User clicks "More fresh", THE System SHALL re-generate recommendations with freshness preference increased toward Fresh
3. WHEN User clicks "More familiar", THE System SHALL re-generate recommendations with freshness preference shifted toward Safe
4. WHEN User clicks "Change mood", THE System SHALL display mood selector to change mood preference and re-generate recommendations
5. WHEN User clicks "More regional", THE System SHALL re-generate recommendations prioritizing regional/non-English language content
6. WHEN User clicks "Avoid mainstream", THE System SHALL re-generate recommendations with avoid preference set to exclude mainstream/viral/overplayed songs
7. WHILE User clicks quick action buttons, THE System SHALL preserve all other preferences (language, activity, reference) unchanged
8. WHEN re-generating recommendations after quick action, THE System SHALL maintain consistent generation logic and response format

### Requirement 9: Frontend Home Page

**User Story:** As a new user, I want to understand the Gaana Discovery AI project and its purpose, so that I can decide whether to explore Review Engine or Discovery Agent.

#### Acceptance Criteria

1. WHEN the Home page loads, THE System SHALL display project title "Gaana Discovery AI" prominently with clear project description
2. WHEN displaying Home page, THE System SHALL explain the two-module flow: "Public reviews → AI analysis → pain points → AI-native discovery MVP"
3. WHEN Home page renders, THE System SHALL display two primary CTAs: "Analyze Reviews" and "Try Discovery Agent" as distinct buttons with clear navigation
4. WHEN Home page displays, THE System SHALL include brief problem statement explaining why music discovery matters and current limitations
5. WHEN User clicks "Analyze Reviews", THE System SHALL navigate to Review_Engine page
6. WHEN User clicks "Try Discovery Agent", THE System SHALL navigate to Discovery_Agent page
7. WHEN Home page loads, THE System SHALL successfully connect to backend /health endpoint and display connection status (if backend is down, show informative message)

### Requirement 10: Frontend Review Engine Page

**User Story:** As a product analyst, I want to fetch and analyze reviews through an intuitive UI, so that I can prepare data for AI analysis.

#### Acceptance Criteria

1. WHEN Review_Engine page loads, THE System SHALL display a form with inputs: appId (pre-filled as "com.gaana"), fromDate, toDate, review count
2. WHEN User interacts with Review_Engine, THE System SHALL provide date picker for fromDate (default January 1, 2026) and toDate (default today)
3. WHEN User interacts with Review_Engine, THE System SHALL provide a number input for review count with range 50-500 and default 300
4. WHEN User clicks "Fetch Reviews", THE System SHALL call backend /api/fetch-reviews endpoint and display loading state
5. WHEN review fetching succeeds, THE System SHALL display success message with review count and show "Analyze Reviews" button
6. WHEN review fetching fails, THE System SHALL display error message and suggest CSV upload fallback
7. WHEN User clicks "Upload CSV", THE System SHALL display file input accepting .csv format
8. WHEN User selects CSV file, THE System SHALL validate file size (max 5MB) and file format before upload
9. WHEN User uploads valid CSV, THE System SHALL call backend /api/upload-csv and display upload success confirmation
10. WHEN "Analyze Reviews" button is clicked, THE System SHALL call backend /api/analyze-reviews and display loading state while analysis is processing
11. WHEN analysis completes successfully, THE System SHALL navigate to Review_Dashboard to display results

### Requirement 11: Frontend Discovery Agent Page

**User Story:** As a music listener, I want an intuitive interface to input discovery preferences and view recommendations, so that I can discover fresh music efficiently.

#### Acceptance Criteria

1. WHEN Discovery_Agent page loads, THE System SHALL display a form with all required input fields organized in logical sections: Mood, Language, Activity, Freshness, Reference, Avoid Preferences
2. WHEN User interacts with form fields, THE System SHALL provide clear labels, helpful placeholders, and option lists
3. WHEN form is displayed, THE System SHALL show mood options as buttons or select dropdown with options: Chill, Sad, Party, Gym, Travel, Focus, Romantic, Energetic
4. WHEN form is displayed, THE System SHALL show language options as multi-select or dropdown with options: Hindi, Punjabi, Tamil, Telugu, Bhojpuri, English, Mixed
5. WHEN form is displayed, THE System SHALL show activity options as buttons or select with options: Studying, Travelling, Gym, Late night, Party, Work, Relaxing
6. WHEN form is displayed, THE System SHALL show freshness preference as radio buttons or select with options: Safe, Balanced, Fresh
7. WHEN form is displayed, THE System SHALL provide reference input as text area accepting artist name, song name, playlist type, or natural language text
8. WHEN form is displayed, THE System SHALL show avoid preferences as checkboxes with options: Avoid repeated artists, Avoid mainstream songs, Avoid overplayed tracks, Avoid sad songs, Avoid slow songs
9. WHEN User clicks "Discover", THE System SHALL call backend /api/discovery-agent with all form data and display loading state
10. WHEN recommendations are returned, THE System SHALL display 8-10 recommendations as cards with all fields: title, artist/type, language fit, why it fits, freshness label, and avoidance logic
11. WHEN recommendations are displayed, THE System SHALL show quick action buttons below recommendations: "More fresh", "More familiar", "Change mood", "More regional", "Avoid mainstream"
12. WHEN User clicks quick action button, THE System SHALL re-generate recommendations with modified preferences while preserving other preferences

### Requirement 12: Frontend About/Limitations Page

**User Story:** As a user or stakeholder, I want to understand the project scope and limitations, so that I can accurately assess what Gaana Discovery AI demonstrates and what it doesn't.

#### Acceptance Criteria

1. WHEN About_Limitations page loads, THE System SHALL display a clear disclaimer: "This MVP uses publicly available metadata/search results or sample catalog data to demonstrate the AI-powered discovery experience. It does not represent Gaana's full internal catalog."
2. WHEN page displays, THE System SHALL explain that review data is collected only from public sources (Google Play Store or user-uploaded CSV)
3. WHEN page displays, THE System SHALL state that no PII is stored in the system and all personal information is removed from reviews
4. WHEN page displays, THE System SHALL clarify that this is a product/AI concept demonstration for learning purposes, not a production system
5. WHEN page displays, THE System SHALL explain that the MVP demonstrates the discovery experience and user problem validation, not Gaana's complete production system
6. WHEN page displays, THE System SHALL include a section on data sources explaining: public review collection, sample music metadata, and Groq API inference
7. WHEN page displays, THE System SHALL include a section on privacy and data protection explaining PII removal process and data retention

### Requirement 13: Backend Health Endpoint

**User Story:** As a deployment engineer, I want to monitor backend service status, so that I can verify service health and detect outages.

#### Acceptance Criteria

1. WHEN the System receives GET request to /health endpoint, THE System SHALL respond with HTTP 200 status code
2. WHEN /health endpoint responds, THE System SHALL return JSON: { "status": "ok", "message": "Gaana Discovery AI backend is running" }
3. WHEN backend service is running, THE System SHALL respond to /health with latency under 100ms
4. WHILE backend is deployed on Railway, THE System SHALL maintain /health endpoint operational and accessible

### Requirement 14: Backend API Error Handling

**User Story:** As a frontend developer, I want consistent, descriptive error responses from backend APIs, so that I can display meaningful messages to users.

#### Acceptance Criteria

1. WHEN backend API encounters an error, THE System SHALL return appropriate HTTP status codes (400 for bad input, 500 for server error, etc.)
2. WHEN API returns error, THE System SHALL include JSON response with fields: error_code, error_message, and optional error_details
3. WHEN error occurs during review fetching, THE System SHALL suggest fallback options (CSV upload) in error message
4. WHEN Groq API fails, THE System SHALL return graceful error without exposing raw API errors or sensitive information
5. WHEN input validation fails, THE System SHALL return specific validation error messages identifying invalid fields
6. WHEN request exceeds rate limits or size limits, THE System SHALL return descriptive error with retry guidance

### Requirement 15: Cross-Origin Resource Sharing (CORS) Configuration

**User Story:** As a full-stack developer, I want CORS properly configured between Vercel frontend and Railway backend, so that frontend can securely call backend APIs.

#### Acceptance Criteria

1. WHEN frontend deployed on Vercel calls backend API on Railway, THE System SHALL accept the cross-origin request without CORS errors
2. WHEN backend receives requests from Vercel frontend URL, THE System SHALL include CORS headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers
3. WHEN backend receives preflight OPTIONS requests, THE System SHALL respond with HTTP 200 and appropriate CORS headers
4. WHILE backend is running, THE System SHALL not allow requests from arbitrary domains (configure CORS to allow only Vercel frontend URL)

### Requirement 16: Environment Variables and Configuration

**User Story:** As a deployment engineer, I want to configure the system through environment variables, so that I can manage API keys and deployment settings securely.

#### Acceptance Criteria

1. WHEN backend starts, THE System SHALL read configuration from environment variables: GROQ_API_KEY, PORT, FRONTEND_URL
2. WHEN backend is deployed on Railway, THE System SHALL use Railway's environment variable management to store GROQ_API_KEY securely
3. WHEN frontend is deployed on Vercel, THE System SHALL use NEXT_PUBLIC_BACKEND_URL environment variable to configure backend API endpoint
4. WHEN System starts, IF required environment variables are missing, THE System SHALL display clear error messages identifying missing variables
5. WHEN System is configured, THE System SHALL never log or expose API keys in logs or responses
6. WHEN System provides example configuration, THE System SHALL include .env.example file with placeholder values and explanatory comments

### Requirement 17: Frontend Deployment on Vercel

**User Story:** As a developer, I want to deploy the Next.js frontend on Vercel with proper configuration, so that users can access the application reliably.

#### Acceptance Criteria

1. WHEN frontend code is pushed to GitHub/GitLab, THE System SHALL auto-deploy to Vercel (if connected)
2. WHEN frontend is deployed on Vercel, THE System SHALL include NEXT_PUBLIC_BACKEND_URL environment variable configured to Railway backend URL
3. WHEN frontend loads on Vercel, THE System SHALL successfully resolve and call backend APIs without CORS errors
4. WHEN Vercel deployment completes, THE System SHALL generate a public URL for accessing the application
5. WHILE frontend is deployed on Vercel, THE System SHALL maintain response time under 2 seconds for page loads
6. WHEN frontend fails to connect to backend, THE System SHALL display user-friendly error message

### Requirement 18: Backend Deployment on Railway

**User Story:** As a deployment engineer, I want to deploy the backend on Railway with proper configuration, so that backend APIs are accessible and reliable.

#### Acceptance Criteria

1. WHEN backend code is deployed to Railway, THE System SHALL start successfully with all required environment variables configured
2. WHEN backend starts on Railway, THE System SHALL initialize Groq API connection and verify API key validity
3. WHEN backend is deployed on Railway, THE System SHALL configure CORS to accept requests from Vercel frontend URL
4. WHILE backend is running on Railway, THE System SHALL maintain /health endpoint response time under 100ms
5. WHEN backend is deployed, THE System SHALL generate a public URL for accessing backend APIs
6. WHEN backend receives requests on Railway, THE System SHALL handle concurrent requests (minimum 10 simultaneous)

### Requirement 19: Music Discovery Accuracy and Relevance

**User Story:** As a music listener, I want recommendations to accurately match my preferences and feel relevant, so that I find genuinely useful music suggestions.

#### Acceptance Criteria

1. WHEN Groq API generates recommendations based on mood and activity, THE System SHALL ensure recommendations are appropriate for stated context
2. WHEN User specifies language preference, THE System SHALL prioritize that language in at least 80% of recommendations
3. WHEN User specifies freshness preference, THE System SHALL weight recommendations accordingly: Safe (>70% known artists), Balanced (50-50 mix), Fresh (<30% known artists)
4. WHEN User provides natural language reference, THE System SHALL interpret and incorporate intent into recommendations
5. WHEN Groq API generates "why this fits" explanation, THE System SHALL provide specific reasoning referencing user's stated preferences
6. WHILE generating recommendations, THE System SHALL avoid recommending same artist/song more than once in single result set

### Requirement 20: Review Data Storage and Retention

**User Story:** As a data steward, I want review data to be handled securely and retained appropriately, so that the system respects user privacy and complies with data regulations.

#### Acceptance Criteria

1. WHEN reviews are analyzed, THE System SHALL not permanently store individual review data after analysis completes (only store aggregated analysis results)
2. WHEN PII is removed from reviews during cleaning, THE System SHALL never store original PII even temporarily in logs or error messages
3. WHEN System processes reviews, THE System SHALL maintain audit logs of analysis operations (but not individual review content) for debugging purposes
4. WHILE System is running, THE System SHALL ensure review data is transmitted securely (HTTPS/TLS) between components

### Requirement 21: System Performance and Response Times

**User Story:** As a user, I want the application to respond quickly to my interactions, so that the discovery experience feels fast and responsive.

#### Acceptance Criteria

1. WHEN backend processes review analysis request with 300 reviews, THE System SHALL complete analysis and return results within 45 seconds
2. WHEN backend processes discovery agent request, THE System SHALL return recommendations within 10 seconds
3. WHEN frontend loads any page, THE System SHALL complete initial page render within 2 seconds
4. WHEN User clicks quick action button on Discovery Agent, THE System SHALL regenerate and return recommendations within 10 seconds
5. WHILE backend API receives requests, THE System SHALL maintain 95th percentile response time under 5 seconds for all endpoints

### Requirement 22: System Reliability and Graceful Degradation

**User Story:** As a user, I want the application to handle failures gracefully, so that I can continue using the system even if some components fail.

#### Acceptance Criteria

1. WHEN Google Play review fetching fails, THE System SHALL suggest CSV upload without crashing the application
2. WHEN Groq API is unavailable, THE System SHALL return descriptive error message and disable affected features temporarily
3. WHEN backend API is temporarily unavailable, THE System SHALL display user-friendly error on frontend without showing technical errors
4. WHEN network connection is interrupted during review analysis, THE System SHALL implement retry logic with exponential backoff (max 3 retries)
5. WHEN recommendation generation partially fails, THE System SHALL return available recommendations with indication of incomplete results rather than no results

### Requirement 23: Documentation and User Guidance

**User Story:** As a user or developer, I want clear documentation explaining how to use the system, so that I can understand functionality and troubleshoot issues.

#### Acceptance Criteria

1. WHEN README is provided in project root, THE System SHALL include: project overview, problem statement, tech stack, setup instructions, environment variables, deployment steps
2. WHEN README is provided, THE System SHALL include step-by-step usage guide for Review Engine workflow
3. WHEN README is provided, THE System SHALL include step-by-step usage guide for Discovery Agent workflow
4. WHEN README is provided, THE System SHALL include demo flow showing end-to-end functionality
5. WHEN README is provided, THE System SHALL include section on known limitations and scope boundaries
6. WHEN README is provided, THE System SHALL include troubleshooting guide for common issues

### Requirement 24: System Monitoring and Logging

**User Story:** As a developer, I want to monitor system behavior and investigate issues, so that I can maintain reliability and debug problems.

#### Acceptance Criteria

1. WHEN backend processes requests, THE System SHALL log API calls with: timestamp, endpoint, request parameters (sanitized), response status, and execution time
2. WHEN errors occur, THE System SHALL log error details with: error message, stack trace, affected component, and context
3. WHILE logging, THE System SHALL never log sensitive information: API keys, PII, or raw review content
4. WHEN backend is deployed on Railway, THE System SHALL make logs accessible through Railway's logging interface
5. WHEN System encounters errors, THE System SHALL log errors without crashing or becoming unresponsive


## Data Requirements

### Review Data Fields
- **source**: Platform source (e.g., "Google Play Store")
- **rating**: Numeric rating 1-5
- **review_title**: Short title/summary of review
- **review_text**: Full review content (cleaned of PII)
- **review_date**: ISO 8601 formatted date
- **source_url**: URL to original review if available
- **cleaned_text**: Review text with PII removed (internal use)

### Music Recommendation Fields
- **title**: Song/artist/playlist name
- **artist_or_type**: Artist name or playlist type
- **language_mood_fit**: Explanation of language and mood compatibility
- **why_this_fits**: Detailed reasoning based on user preferences
- **how_fresh_this_is**: Freshness assessment (new release, emerging artist, established but underrated, etc.)
- **freshness_label**: Categorized freshness (Safe/Balanced/Fresh)
- **avoids_repeating**: Explanation of what repeated patterns this avoids

### Analysis Result Structure
- **summary**: High-level summary of review analysis
- **total_reviews_analyzed**: Count of reviews processed
- **date_range**: String representing analysis date range
- **sources**: List of review sources (e.g., ["Google Play Store"])
- **themes**: Array of theme objects with count, description, pain_point, quotes, opportunity
- **sentiment_summary**: Object with positive, neutral, negative percentages
- **target_user_segment**: Description of identified user segment
- **problem_statement**: AI-generated problem statement (2-3 sentences)
- **business_opportunity**: Summary of opportunity to address pain points

## Integration Requirements

### Groq API Integration
- **Purpose**: AI inference for review analysis, problem statement generation, and music discovery
- **Configuration**: API key provided via GROQ_API_KEY environment variable
- **Endpoints Used**: Groq chat completion API
- **Rate Limiting**: Handle rate limits gracefully with retry logic
- **Error Handling**: Return descriptive errors if API is unavailable or request fails
- **Cost Optimization**: Batch review analysis where possible to reduce token usage

### Google Play Store Review Fetching
- **Data Source**: Public reviews for app ID com.gaana
- **Method**: Use official Google Play API or third-party scraper library
- **Fallback**: CSV upload if scraping fails
- **Error Handling**: Graceful error messages suggesting fallback options
- **Date Filtering**: Client-side filtering to ensure January 1, 2026 to today date range

### CSV Upload and Parsing
- **Format**: CSV with columns: source, rating, review_title, review_text, review_date, source_url
- **Validation**: Check file size (max 5MB), format, and required columns
- **Parsing**: Handle various date formats and normalize to ISO 8601
- **Error Messages**: Provide specific validation errors for malformed data

## UI/UX Requirements

### Design Principles
- **Simplicity**: Prioritize working functionality over fancy design
- **Clarity**: Use clear labels, helpful placeholders, and organized layout
- **Accessibility**: Ensure basic accessibility compliance (color contrast, keyboard navigation, alt text)
- **Responsiveness**: Support mobile, tablet, and desktop viewports
- **Feedback**: Display loading states, success messages, and error messages clearly

### Navigation Flow
1. **Home Page** → Choose "Analyze Reviews" or "Try Discovery Agent"
2. **Review Engine Path**: Home → Review Engine → Review Dashboard
3. **Discovery Agent Path**: Home → Discovery Agent → Results

### Page Layout Specifications
- **Home Page**: Header with title, brief intro, two CTA buttons
- **Review Engine**: Form inputs (appId, dates, count), upload area, action button
- **Review Dashboard**: Summary metrics at top, themes section, quotes section, insights section, opportunity summary
- **Discovery Agent**: Form section with grouped inputs, submit button, results cards with quick actions below
- **About Page**: Disclaimer, data sources, privacy info, limitations

## Acceptance Criteria Summary

### Theme 1: Review Discovery and Analysis
- Review data ingestion from Google Play or CSV
- PII removal and data cleaning
- AI analysis using Groq API
- Problem statement generation
- Review dashboard display

### Theme 2: Music Discovery Agent
- Preference form with mood, language, activity, freshness, reference, avoid inputs
- Natural language preference interpretation
- AI-powered recommendation generation using Groq API
- Consistent, relevant recommendations matching stated preferences
- Quick action buttons for iterative refinement

### Theme 3: Frontend User Interface
- Home page with navigation
- Review Engine page with data ingestion workflow
- Review Dashboard page with analysis results
- Discovery Agent page with preference form and results
- About/Limitations page with scope clarification

### Theme 4: Backend API Services
- /health endpoint for service monitoring
- /fetch-reviews endpoint for Google Play review collection
- /upload-csv endpoint for CSV data ingestion
- /analyze-reviews endpoint for AI analysis
- /discovery-agent endpoint for music recommendations
- Error handling and CORS configuration

### Theme 5: Deployment and Infrastructure
- Frontend deployment on Vercel with environment variable configuration
- Backend deployment on Railway with API key management
- CORS configuration between frontend and backend
- Environment variable management for both platforms
- Logging and monitoring capabilities

### Theme 6: Data Privacy and Security
- PII removal from reviews
- Secure API key management
- HTTPS/TLS for data transmission
- No permanent storage of individual review text
- Audit logging without exposing sensitive information

### Theme 7: Performance and Reliability
- Review analysis completes within 45 seconds (300 reviews)
- Discovery recommendations return within 10 seconds
- Page loads within 2 seconds
- API response times (95th percentile) under 5 seconds
- Graceful error handling and fallbacks

## Known Limitations and Scope Boundaries

### Music Catalog
- This MVP uses publicly available metadata and sample data, not Gaana's full internal catalog
- Recommendations are demonstrative of the AI-powered discovery approach
- Production implementation would require access to Gaana's actual music catalog and listening data

### Review Data Sources
- Review collection relies on public Google Play Store data only
- No access to Gaana's internal customer feedback or listening analytics
- CSV upload serves as fallback for demonstration purposes

### Personalization Scope
- Recommendations are context-aware (mood, activity, language, freshness) but not based on individual user listening history
- Production system would incorporate user listening data for more personalized recommendations

### AI Inference
- Discovery recommendations are generated by Groq API and may reflect limitations of the model
- Recommendations are demonstrative and may not reflect real music availability or quality

### Data Privacy
- System does not integrate with real Gaana user accounts or personal data
- All analysis is performed on public review data with PII removed
- This is a demonstration system, not production-ready for real user data

### Scale and Performance
- System is optimized for batch review analysis (50-500 reviews per session)
- Performance assumptions are based on estimated API response times
- Production deployment would require load testing and optimization

## Glossary (Extended)

- **Groq API**: Third-party AI inference service providing fast language model access
- **CORS**: Cross-Origin Resource Sharing - mechanism allowing requests between different domains
- **PII Removal**: Process of detecting and replacing sensitive personal information
- **Batch Processing**: Processing multiple records together for efficiency
- **Freshness**: Metric indicating how new or novel a recommendation is relative to user's established preferences
- **Theme**: Grouped category of similar feedback extracted from review analysis
- **Sentiment Analysis**: Classification of text as positive, neutral, or negative
- **Round-trip Property**: Testing pattern verifying that encode/decode or parse/print operations preserve data
- **Idempotence**: Property where repeating an operation produces same result as single operation
- **Metamorphic Property**: Relationship that must hold between system components
