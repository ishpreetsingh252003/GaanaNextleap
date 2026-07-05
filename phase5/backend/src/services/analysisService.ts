import { FALLBACK_ANALYSIS } from "../data/fallbackAnalysis";
import { fallbackReviews, FallbackReview } from "../data/fallbackData";
import { Review, ReviewSource } from "../types/review";
import { normalizeReviewDate } from "../utils/dateFilter";

export const VALID_REVIEW_SOURCES: ReviewSource[] = [
  "google_play",
  "app_store",
  "reddit",
  "quora",
  "web_news",
  "twitter_web",
];

export const GROQ_SAMPLE_LIMIT = 90;
export const GROQ_CHUNK_SIZE = 50;
export const REPRESENTATIVE_REVIEW_LIMIT = 8;

const SIGNAL_KEYWORDS = [
  "repeat",
  "repetitive",
  "same songs",
  "old songs",
  "new songs",
  "old playlist",
  "playlist",
  "recommendation",
  "mood",
  "language",
  "regional",
  "mainstream",
  "fresh",
  "discover",
  "artists",
  "artist",
  "gym",
  "travel",
  "party",
  "chill",
];

export interface ReviewFilters {
  sources?: string[];
  startDate?: string;
  endDate?: string;
}

export interface AnalysisMetadata {
  totalReviews: number;
  sourcesUsed: ReviewSource[];
  requestedDateRange: { startDate: string | null; endDate: string | null };
  actualDateRange: { startDate: string | null; endDate: string | null };
}

export interface SourceDiagnostic {
  source: ReviewSource;
  label: string;
  attemptedLiveFetch: boolean;
  fetcherType: "live" | "live_with_credentials" | "placeholder" | "fallback_assisted" | "fallback_only";
  liveRawCount: number;
  fallbackRawCount: number;
  combinedRawCount: number;
  beforeDateFilterCount: number;
  afterDateFilterCount: number;
  afterCleaningCount: number;
  afterDedupeCount: number;
  finalCountUsed: number;
  invalidDateCount: number;
  removedEmptyCount: number;
  removedTooShortCount: number;
  removedLanguageCount: number;
  removedDuplicateCount: number;
  removedInvalidDateCount: number;
  fallbackUsed: boolean;
  reason?: string;
}

export function fallbackToReview(review: FallbackReview): Review {
  return {
    id: review.id,
    source: normalizeSource(review.source),
    rating: review.rating ?? null,
    title: "Public feedback signal",
    text: review.text,
    author: "Public feedback",
    date: review.date,
    url: null,
    lang: "en",
  };
}

export function getFallbackReviewDataset(): Review[] {
  return fallbackReviews.map(fallbackToReview);
}

export function normalizeSource(source: string): ReviewSource {
  const normalized = source.trim().toLowerCase().replace(/[\s/-]+/g, "_");
  const aliases: Record<string, ReviewSource> = {
    google_play: "google_play",
    google_play_store: "google_play",
    app_store: "app_store",
    apple_app_store: "app_store",
    reddit: "reddit",
    quora: "quora",
    web_news: "web_news",
    web: "web_news",
    news: "web_news",
    web_and_news: "web_news",
    twitter: "twitter_web",
    twitter_x: "twitter_web",
    twitter_web: "twitter_web",
    x: "twitter_web",
  };
  return aliases[normalized] ?? (source as ReviewSource);
}

export function filterReviews(reviews: Review[], filters: ReviewFilters): Review[] {
  const selectedSources = filters.sources
    ?.map(normalizeSource)
    .filter((source): source is ReviewSource => VALID_REVIEW_SOURCES.includes(source));

  const start = filters.startDate ? startOfDay(filters.startDate) : null;
  const end = filters.endDate ? endOfDay(filters.endDate) : null;

  return reviews.filter((review) => {
    const source = normalizeSource(review.source);
    if (selectedSources?.length && !selectedSources.includes(source)) return false;

    const normalizedDate = normalizeReviewDate(review.date);
    if (!normalizedDate) return false;
    const reviewDate = new Date(`${normalizedDate}T12:00:00.000Z`);
    if (start && reviewDate < start) return false;
    if (end && reviewDate > end) return false;

    return true;
  });
}

export function sourceLabel(source: ReviewSource): string {
  const labels: Record<ReviewSource, string> = {
    google_play: "Google Play",
    app_store: "App Store",
    reddit: "Reddit",
    quora: "Quora",
    web_news: "Web / News",
    twitter_web: "Twitter / X",
  };
  return labels[source];
}

export function getFetcherType(source: ReviewSource): SourceDiagnostic["fetcherType"] {
  if (source === "twitter_web") return process.env.X_BEARER_TOKEN ? "live_with_credentials" : "fallback_only";
  if (source === "reddit") {
    return process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET ? "live_with_credentials" : "live";
  }
  if (source === "quora" || source === "web_news") {
    return hasWebSearchProvider() ? "live_with_credentials" : "fallback_assisted";
  }
  return "live";
}

function hasWebSearchProvider(): boolean {
  return Boolean(
    (process.env.WEB_SEARCH_PROVIDER && process.env.WEB_SEARCH_API_KEY) ||
      process.env.BRAVE_SEARCH_API_KEY ||
      process.env.TAVILY_API_KEY ||
      process.env.SERPAPI_API_KEY
  );
}

export function countInvalidDates(reviews: Review[]): number {
  return reviews.filter((review) => !normalizeReviewDate(review.date)).length;
}

export function buildAnalysisMetadata(reviews: Review[], filters: ReviewFilters): AnalysisMetadata {
  const timestamps = reviews
    .map((review) => new Date(review.date).getTime())
    .filter((time) => !Number.isNaN(time));

  return {
    totalReviews: reviews.length,
    sourcesUsed: Array.from(new Set(reviews.map((review) => normalizeSource(review.source)))),
    requestedDateRange: {
      startDate: filters.startDate ?? null,
      endDate: filters.endDate ?? null,
    },
    actualDateRange: {
      startDate: timestamps.length ? toDateOnly(new Date(Math.min(...timestamps))) : null,
      endDate: timestamps.length ? toDateOnly(new Date(Math.max(...timestamps))) : null,
    },
  };
}

export function selectRepresentativeReviews(reviews: Review[], limit = REPRESENTATIVE_REVIEW_LIMIT): Review[] {
  return selectSignalRichSample(reviews, limit);
}

export function buildGroqSample(reviews: Review[], limit = GROQ_SAMPLE_LIMIT): Review[] {
  return buildStratifiedReviewSample(reviews, limit);
}

export function buildStratifiedReviewSample(reviews: Review[], limit = GROQ_SAMPLE_LIMIT): Review[] {
  if (reviews.length <= limit) return [...reviews];

  const selected = new Map<string, Review>();
  const addBest = (bucket: Review[]) => {
    if (selected.size >= limit || bucket.length === 0) return;
    const best = [...bucket]
      .filter((review) => !selected.has(review.id))
      .sort(scoreReviews)[0];
    if (best) selected.set(best.id, best);
  };

  for (const source of VALID_REVIEW_SOURCES) {
    const sourceReviews = reviews.filter((review) => normalizeSource(review.source) === source);
    addBest(sourceReviews.filter((review) => sentimentBucket(review) === "negative"));
    addBest(sourceReviews.filter((review) => sentimentBucket(review) === "neutral"));
    addBest(sourceReviews.filter((review) => sentimentBucket(review) === "positive"));
  }

  const months = Array.from(new Set(reviews.map((review) => review.date.slice(0, 7)))).sort();
  for (const month of months) {
    for (const source of VALID_REVIEW_SOURCES) {
      addBest(reviews.filter((review) => review.date.startsWith(month) && normalizeSource(review.source) === source));
    }
  }

  for (const keyword of SIGNAL_KEYWORDS) {
    addBest(reviews.filter((review) => reviewContains(review, keyword)));
  }

  const remaining = [...reviews]
    .filter((review) => !selected.has(review.id))
    .sort(scoreReviews);
  for (const review of remaining) {
    if (selected.size >= limit) break;
    selected.set(review.id, review);
  }

  return Array.from(selected.values()).slice(0, limit);
}

export function buildGroqChunks(reviews: Review[], chunkSize = GROQ_CHUNK_SIZE): Review[][] {
  const chunks: Review[][] = [];
  for (let i = 0; i < reviews.length; i += chunkSize) {
    chunks.push(reviews.slice(i, i + chunkSize));
  }
  return chunks;
}

export function compactReviewForGroq(review: Review) {
  return {
    review_id: review.id,
    source: normalizeSource(review.source),
    date: review.date,
    rating: review.rating,
    snippet: sanitizeText(review.cleaned_text || review.text).slice(0, 420),
  };
}

export function containsPII(text: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
    /(?:\+?\d[\s-]?){8,}/.test(text) ||
    /(^|\s)@[a-z0-9_]{3,}/i.test(text);
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[removed]")
    .replace(/(?:\+?\d[\s-]?){8,}/g, "[removed]")
    .replace(/(^|\s)@[a-z0-9_]{3,}/gi, "$1[removed]");
}

export function validateAnalysisResult(analysis: any, reviews: Review[]): boolean {
  if (!analysis || !Array.isArray(analysis.themes)) return false;
  if (analysis.themes.length > 5) analysis.themes = analysis.themes.slice(0, 5);
  if (!Array.isArray(analysis.representativeReviews)) analysis.representativeReviews = selectRepresentativeReviews(reviews);
  analysis.representativeReviews = analysis.representativeReviews.slice(0, REPRESENTATIVE_REVIEW_LIMIT);
  if (!analysis.problem_statement && !analysis.problemStatement) return false;
  if (!analysis.business_opportunity && !analysis.opportunity) return false;

  const reviewTexts = reviews.map((review) => sanitizeText(review.text));
  const quotes = [
    ...(Array.isArray(analysis.quotes) ? analysis.quotes : []),
    ...(Array.isArray(analysis.representative_quotes) ? analysis.representative_quotes : []),
    ...analysis.themes.flatMap((theme: any) => Array.isArray(theme.representative_quotes) ? theme.representative_quotes : []),
  ].filter((quote: unknown): quote is string => typeof quote === "string");

  const safeQuotes = quotes
    .map(sanitizeText)
    .filter((quote) => !containsPII(quote))
    .filter((quote) => reviewTexts.some((text) => text.includes(quote) || quote.includes(text.slice(0, Math.min(60, text.length)))));

  analysis.quotes = safeQuotes.slice(0, 8);
  analysis.representative_quotes = safeQuotes.slice(0, 8);
  return true;
}

export function buildReliableFallbackAnalysis(reviews: Review[], filters: ReviewFilters) {
  const metadata = buildAnalysisMetadata(reviews, filters);
  const quotes = selectRepresentativeReviews(reviews, 6).map((review) => review.text);

  return {
    ...FALLBACK_ANALYSIS,
    total_reviews_analyzed: metadata.totalReviews,
    themes: metadata.totalReviews === 0 ? [] : FALLBACK_ANALYSIS.themes,
    sentiment_summary:
      metadata.totalReviews === 0
        ? { positive: 0, neutral: 0, negative: 0 }
        : FALLBACK_ANALYSIS.sentiment_summary,
    summary:
      metadata.totalReviews === 0
        ? "No feedback entries matched the selected sources and date range."
        : FALLBACK_ANALYSIS.summary,
    problem_statement:
      metadata.totalReviews === 0
        ? "No feedback entries matched the selected sources and date range. Try expanding the date range or selecting more sources."
        : FALLBACK_ANALYSIS.problem_statement,
    business_opportunity:
      metadata.totalReviews === 0
        ? "Expand the selected source or date range to generate a more useful opportunity summary."
        : FALLBACK_ANALYSIS.business_opportunity,
    representative_quotes: quotes,
    sourcesUsed: metadata.sourcesUsed,
    sources_used: metadata.sourcesUsed,
    requestedDateRange: metadata.requestedDateRange,
    requested_date_range: metadata.requestedDateRange,
    actualDateRange: metadata.actualDateRange,
    actual_date_range: metadata.actualDateRange,
    representativeReviews: selectRepresentativeReviews(reviews),
    isFallback: true,
    is_fallback: true,
    analysisMode: "reliable_demo_analysis",
    analysis_mode: "reliable_demo_analysis",
  };
}

export function buildZeroMatchPayload(filters: ReviewFilters) {
  const sourcesUsed = filters.sources?.map(normalizeSource) ?? [];
  const requestedDateRange = {
    startDate: filters.startDate ?? null,
    endDate: filters.endDate ?? null,
  };
  const message =
    "No feedback entries matched the selected sources and date range. Try expanding the date range or selecting more sources.";

  return {
    success: true,
    total_reviews_submitted: 0,
    totalReviews: 0,
    sourcesUsed,
    requestedDateRange,
    actualDateRange: { startDate: null, endDate: null },
    representativeReviews: [],
    message,
    analysis: {
      ...buildReliableFallbackAnalysis([], filters),
      themes: [],
      painPoints: [],
      pain_points: [],
      quotes: [],
      representative_quotes: [],
      representativeReviews: [],
      message,
      isFallback: true,
      is_fallback: true,
      analysisMode: "reliable_demo_analysis",
      analysis_mode: "reliable_demo_analysis",
    },
  };
}

export function shapeAnalysisResponse(analysis: any, reviews: Review[], filters: ReviewFilters, isFallback: boolean) {
  const metadata = buildAnalysisMetadata(reviews, filters);
  const representativeReviews = selectRepresentativeReviews(reviews);
  const themes = Array.isArray(analysis.themes) ? analysis.themes : FALLBACK_ANALYSIS.themes;

  return {
    success: true,
    total_reviews_submitted: metadata.totalReviews,
    totalReviews: metadata.totalReviews,
    sourcesUsed: metadata.sourcesUsed,
    requestedDateRange: metadata.requestedDateRange,
    actualDateRange: metadata.actualDateRange,
    representativeReviews,
    message: analysis.message,
    analysisMode: isFallback ? "reliable_demo_analysis" : "groq_analysis",
    analysis_mode: isFallback ? "reliable_demo_analysis" : "groq_analysis",
    analysis: {
      ...analysis,
      total_reviews_analyzed: metadata.totalReviews,
      totalReviews: metadata.totalReviews,
      sourcesUsed: metadata.sourcesUsed,
      sources_used: metadata.sourcesUsed,
      requestedDateRange: metadata.requestedDateRange,
      requested_date_range: metadata.requestedDateRange,
      actualDateRange: metadata.actualDateRange,
      actual_date_range: metadata.actualDateRange,
      themes,
      painPoints: themes.map((theme: any) => theme.pain_point).filter(Boolean),
      pain_points: themes.map((theme: any) => theme.pain_point).filter(Boolean),
      quotes: themes.flatMap((theme: any) => theme.representative_quotes ?? []).slice(0, 8),
      problemStatement: analysis.problem_statement ?? analysis.problemStatement,
      opportunity: analysis.business_opportunity ?? analysis.opportunity,
      representativeReviews,
      isFallback: isFallback,
      is_fallback: isFallback,
      analysisMode: isFallback ? "reliable_demo_analysis" : "groq_analysis",
      analysis_mode: isFallback ? "reliable_demo_analysis" : "groq_analysis",
    },
  };
}

function selectSignalRichSample(reviews: Review[], limit: number): Review[] {
  if (reviews.length <= limit) return [...reviews];

  const bySource = new Map<ReviewSource, Review[]>();
  for (const review of reviews) {
    const source = normalizeSource(review.source);
    bySource.set(source, [...(bySource.get(source) ?? []), review]);
  }

  const selected: Review[] = [];
  for (const source of VALID_REVIEW_SOURCES) {
    const sourceReviews = bySource.get(source) ?? [];
    const best = sourceReviews.sort(scoreReviews)[0];
    if (best) selected.push(best);
  }

  const remaining = reviews
    .filter((review) => !selected.some((item) => item.id === review.id))
    .sort(scoreReviews);

  for (const review of remaining) {
    if (selected.length >= limit) break;
    selected.push(review);
  }

  return selected.slice(0, limit);
}

function scoreReviews(a: Review, b: Review): number {
  return scoreReview(b) - scoreReview(a);
}

function scoreReview(review: Review): number {
  const text = `${review.title} ${review.text}`.toLowerCase();
  const keywordScore = SIGNAL_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
  const ratingScore = review.rating !== null && review.rating <= 2 ? 3 : review.rating === 3 ? 1 : 0;
  return keywordScore + ratingScore;
}

function sentimentBucket(review: Review): "negative" | "neutral" | "positive" {
  if (review.rating !== null) {
    if (review.rating <= 2) return "negative";
    if (review.rating >= 4) return "positive";
  }
  return "neutral";
}

function reviewContains(review: Review, keyword: string): boolean {
  return `${review.title} ${review.text}`.toLowerCase().includes(keyword);
}

function startOfDay(date: string): Date {
  return new Date(`${normalizeReviewDate(date) ?? date}T00:00:00.000Z`);
}

function endOfDay(date: string): Date {
  return new Date(`${normalizeReviewDate(date) ?? date}T23:59:59.999Z`);
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}
