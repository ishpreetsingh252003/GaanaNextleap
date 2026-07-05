import { FALLBACK_ANALYSIS } from "../data/fallbackAnalysis";
import { fallbackReviews, FallbackReview } from "../data/fallbackData";
import { Review, ReviewSource } from "../types/review";

export const VALID_REVIEW_SOURCES: ReviewSource[] = [
  "google_play",
  "app_store",
  "reddit",
  "quora",
  "web_news",
  "twitter_web",
];

export const GROQ_SAMPLE_LIMIT = 30;
export const REPRESENTATIVE_REVIEW_LIMIT = 8;

const SIGNAL_KEYWORDS = [
  "repetitive",
  "same songs",
  "old playlist",
  "recommendation",
  "mood",
  "language",
  "regional",
  "mainstream",
  "fresh",
  "discover",
  "artists",
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

    const reviewDate = new Date(review.date);
    if (Number.isNaN(reviewDate.getTime())) return false;
    if (start && reviewDate < start) return false;
    if (end && reviewDate > end) return false;

    return true;
  });
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
  return selectSignalRichSample(reviews, limit);
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
  return SIGNAL_KEYWORDS.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);
}

function startOfDay(date: string): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: string): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}
