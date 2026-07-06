const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export type ReviewSource =
  | "google_play"
  | "app_store"
  | "reddit"
  | "quora"
  | "web_news"
  | "twitter_web";

export interface Review {
  id: string;
  source: ReviewSource;
  rating: number | null;
  title: string;
  text: string;
  author: string;
  date: string;
  url: string | null;
  lang: string;
  cleaned_text?: string;
  pii_found?: boolean;
  cleaning_applied?: string[];
}

export interface ScrapeResponse {
  success: boolean;
  total_reviews: number;
  date_range: { from: string; to: string };
  sources_summary: Partial<Record<ReviewSource, number>>;
  errors?: { source: ReviewSource; message: string }[];
  reviews: Review[];
  message?: string;
  sourceDiagnostics?: SourceDiagnostic[];
  sourceConfigDiagnostics?: SourceConfigDiagnostics;
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
  apiAttempted?: boolean;
  apiStatusCode?: number | null;
  apiErrorType?: string | null;
  apiErrorMessageSafe?: string | null;
  rawResponseShape?: string | null;
  rawResultCount?: number;
  normalizedResultCount?: number;
  finalReason?: string;
  provider?: string | null;
  rssFetched?: boolean;
  rssStatusCode?: number | null;
  rssEntryCount?: number;
  rssReviewLikeEntryCount?: number;
  parsedReviewCount?: number;
}

export interface SourceConfigDiagnostics {
  appStoreAppIdPresent: boolean;
  appStoreAppIdLength: number;
  appStoreCountry: string;
  webSearchProviderRaw: string | null;
  webSearchProviderResolved: string | null;
  webSearchApiKeyPresent: boolean;
  webSearchApiKeyLength: number;
  tavilyApiKeyPresent: boolean;
  braveSearchApiKeyPresent: boolean;
  serpApiKeyPresent: boolean;
  redditUserAgentPresent: boolean;
  redditClientIdPresent: boolean;
  redditClientSecretPresent: boolean;
  nodeEnv: string | null;
  runtime: "render" | "local" | "unknown";
}

export interface SourceInfo {
  id: ReviewSource;
  label: string;
  description: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
}

export interface AnalysisTheme {
  theme_name: string;
  count: number;
  description: string;
  pain_point: string;
  representative_quotes: string[];
  opportunity: string;
}

export interface AnalysisResult {
  summary: string;
  total_reviews_analyzed: number;
  date_range?: string;
  themes: AnalysisTheme[];
  sentiment_summary: { positive: number; neutral: number; negative: number };
  target_user_segment: string;
  problem_statement: string;
  business_opportunity: string;
  representativeReviews?: Review[];
  message?: string;
  is_fallback?: boolean;
  analysisMode?: string;
  analysis_mode?: string;
  _fallback_reason?: string;
}

export interface DiscoveryPreferences {
  query?: string;
  mood?: string;
  language?: string;
  activity?: string;
  freshness?: string;
  reference?: string;
  avoid: string[];
  refineAction?: string;
}

export interface RecommendationCard {
  title: string;
  artist_or_type: string;
  artist?: string;
  album?: string;
  artwork?: string;
  previewUrl?: string;
  externalUrl?: string;
  source?: "itunes" | "demo";
  type?: "track";
  language_mood_fit: string;
  why_this_fits: string;
  bestFor?: string;
  best_for?: string;
  how_fresh_this_is: string;
  freshness_label: "Safe" | "Balanced" | "Fresh";
  avoids_repeating: string;
}

export interface DiscoveryResponse {
  success: boolean;
  recommendations: RecommendationCard[];
  explanation: string;
  query_used: string;
  matched_using?: "public_music_metadata";
  message?: string;
  resolved_preferences?: Partial<DiscoveryPreferences>;
  inferred_preferences?: Partial<DiscoveryPreferences>;
  ui_preferences?: Partial<DiscoveryPreferences> & { queryType?: "reference" | "intent" };
  is_fallback?: boolean;
  _fallback_reason?: string;
}

export class BackendError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "BackendError";
  }
}

const DEFAULT_TIMEOUT = 90_000; // 90 s — scraping + AI can be slow

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        if (body?.error_message) msg = body.error_message;
      } catch { /* ignore */ }
      throw new BackendError(msg, res.status);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof BackendError) throw err;
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new BackendError(
          "This analysis is taking longer than expected. Try again, or run the full demo analysis for a reliable evaluation view.",
          408
        );
      }
      throw new BackendError(err.message);
    }
    throw new BackendError("Unknown network error");
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

export const checkHealth = () => apiFetch<HealthResponse>("/api/health");

export const getSources = () =>
  apiFetch<{ sources: SourceInfo[] }>("/api/reviews/sources");

export const scrapeReviews = (sources?: ReviewSource[], startDate?: string, endDate?: string) =>
  apiFetch<ScrapeResponse>("/api/reviews/scrape", {
    method: "POST",
    body: JSON.stringify({ 
      sources: sources?.length ? sources : undefined,
      startDate,
      endDate,
    }),
  });

export const analyzeReviews = (
  reviews: Review[],
  sources?: ReviewSource[],
  startDate?: string,
  endDate?: string,
  collectSources?: boolean
) =>
  apiFetch<{ success: boolean; total_reviews_submitted: number; totalReviews?: number; sourcesUsed?: ReviewSource[]; sourceDiagnostics?: SourceDiagnostic[]; sourceConfigDiagnostics?: SourceConfigDiagnostics; representativeReviews?: Review[]; message?: string; analysis: AnalysisResult }>(
    "/api/analysis/review-analysis",
    { method: "POST", body: JSON.stringify({ reviews, sources, startDate, endDate, collectSources }) }
  );

/** Request the pre-generated fallback analysis (no Groq call) */
export const loadFallbackAnalysis = (sources?: ReviewSource[], startDate?: string, endDate?: string) =>
  apiFetch<{ success: boolean; total_reviews_submitted: number; totalReviews?: number; sourcesUsed?: ReviewSource[]; sourceDiagnostics?: SourceDiagnostic[]; sourceConfigDiagnostics?: SourceConfigDiagnostics; representativeReviews?: Review[]; message?: string; analysis: AnalysisResult }>(
    "/api/analysis/review-analysis",
    { method: "POST", body: JSON.stringify({ useFallback: true, reviews: [], sources, startDate, endDate }) }
  );

export const generateRecommendations = (preferences: DiscoveryPreferences) =>
  apiFetch<DiscoveryResponse>("/api/discovery-agent", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
