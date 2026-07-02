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
}

export interface SourceInfo {
  id: ReviewSource;
  label: string;
  description: string;
}

export interface HealthResponse {
  status: string;
  phase: number;
  timestamp: string;
}

export class BackendError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "BackendError";
  }
}

const DEFAULT_TIMEOUT = 60000;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const err = await res.json();
        if (typeof err === "object" && err !== null && "error_message" in err && typeof (err as any).error_message === "string") {
          errorMessage = (err as any).error_message;
        }
      } catch {
        errorMessage = `HTTP ${res.status}`;
      }
      const backendError = new BackendError(errorMessage, res.status);
      clearTimeout(timeoutId);
      throw backendError;
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof BackendError) {
      throw err;
    }
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new BackendError("Request timed out — backend may be slow or unresponsive");
      }
      throw new BackendError(err.message);
    }
    throw new BackendError("Unknown network error");
  } finally {
    clearTimeout(timeoutId);
  }
}

export const checkHealth = () =>
  apiFetch<HealthResponse>("/api/health");

export const getSources = () =>
  apiFetch<{ sources: SourceInfo[] }>("/api/reviews/sources");

export const scrapeReviews = async (sources?: ReviewSource[]): Promise<ScrapeResponse> => {
  const body: Record<string, ReviewSource[]> = sources?.length ? { sources } : {};
  return apiFetch<ScrapeResponse>("/api/reviews/scrape", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const analyzeReviews = (reviews: Review[]) =>
  apiFetch<{ analysis: any }>("/api/analysis/review-analysis", {
    method: "POST",
    body: JSON.stringify({ reviews }),
  });

export interface DiscoveryPreferences {
  mood: string;
  language: string;
  activity: string;
  freshness: string;
  reference?: string;
  avoid: string[];
}

export interface DiscoveryResponse {
  success: boolean;
  recommendations: {
    title: string;
    artist_or_type: string;
    language_mood_fit: string;
    why_this_fits: string;
    how_fresh_this_is: string;
    freshness_label: "Safe" | "Balanced" | "Fresh";
    avoids_repeating: string;
  }[];
  explanation: string;
  query_used: string;
}

export const generateRecommendations = (preferences: DiscoveryPreferences) =>
  apiFetch<DiscoveryResponse>("/api/discovery-agent", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
