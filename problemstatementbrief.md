# Gaana Discovery AI — Problem Statement

## Product context
Gaana is a leading music streaming platform in India, serving millions of listeners across genres, languages, and moods. Despite its recommendation algorithms, many users still fall into repetitive listening loops, relying on familiar playlists and repeat artists.

## Problem summary
The current discovery experience is too narrow for many users. Listeners often report that recommendations feel stale, too mainstream, and poorly matched to their current mood, language preference, or activity. This leads to reduced discovery, repetitive listening, and lower long-term engagement.

### Core problem
Gaana’s existing recommendation pipeline prioritizes familiarity and popularity, which causes meaningful music discovery to underperform for users who want:
- fresher songs rather than repeated hits
- better mood- and activity-aware suggestions
- regional or non-English music that feels relevant
- active discovery without manual search or playlist browsing

## Target user segment
Primary segment: young Indian listeners, age 18–30, who are:
- digitally savvy and genre-curious
- open to new artists and regional language music
- frustrated by repeated playlists
- looking for music that fits a mood, workout, commute, study session, or social moment
- willing to trust AI if it offers higher relevance than standard algorithmic recommendations

## User needs and observed behaviors
- Users want recommendations that feel personalized to a current context, not just based on past streams.
- They want discovery that is more than ‘‘popular now’’ — they want novelty that still fits their taste.
- They expect recommendations to change with their mood, activity, and language preference.
- Current reviews and social conversations show users often describe the platform as ‘‘recommending the same songs again and again.’’
- Many users perceive the music feed as biased toward mainstream or viral content.

## Business opportunity
Solving this problem can deliver measurable value for Gaana:
- increase session duration by reducing playlist fatigue
- improve discovery metrics and active usage
- surface long-tail and regional artists more effectively
- demonstrate AI-native product differentiation from standard recommender systems
- convert passive listeners into engaged discovery users

## Why AI is needed
Traditional recommendation systems struggle here because they optimize for behavior signals and popularity, not for the nuanced reasons behind why a user wants new music.
AI enables the product to:
- analyze large volumes of public feedback to discover hidden user pain points
- synthesize review themes into a clear problem statement and target segment
- generate context-aware music suggestions based on mood, language, activity, freshness, and avoidance preferences
- offer an interactive discovery experience with quick iteration and refinement

## What this repo currently delivers
This repository currently implements the review discovery engine and initial product scaffolding for an AI-native discovery workflow:
- multi-source scraping of public feedback from Google Play, App Store, Reddit, Quora, web forums, and Twitter
- review cleaning, deduplication, and PII masking
- a Groq AI analysis backend for extracting themes, sentiment, problem statements, and opportunity narratives
- a main frontend scaffold in `phase3/main-frontend` for review flow and discovery screens
- an optional scraper utility UI in `phase3/scraper-frontend`
- deployment-ready backend and frontend configuration

## What still needs to be completed
To fully match the graduation problem statement, the following work remains:
- complete Phase 4 Discovery Agent MVP for AI-generated music recommendations
- wire actual Groq analysis results into the dashboard UI
- build recommendation cards and quick-action refinement flows
- capture user research / interview validation evidence
- finalize production-grade deployment links and submission assets

## Final scope for graduation delivery
The final project should demonstrate:
1. an AI-powered review discovery workflow that answers why users struggle to find new music
2. a validated problem statement and target segment derived from user feedback
3. a deployed AI-native MVP that generates meaningful discovery recommendations
4. why the AI approach is better than traditional recommendation systems

## Current repo status
This repo is on track for the review analysis portion of the graduation project. The remaining gap is the music discovery recommendation engine and the research validation artifacts required for final submission.
