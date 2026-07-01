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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error_message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const checkHealth = () =>
  apiFetch<{ status: string; phase: number; timestamp: string }>("/api/health");

export const getSources = () =>
  apiFetch<{ sources: SourceInfo[] }>("/api/reviews/sources");

export const scrapeReviews = (sources?: ReviewSource[]) =>
  apiFetch<ScrapeResponse>("/api/reviews/scrape", {
    method: "POST",
    body: JSON.stringify(sources?.length ? { sources } : {}),
  });

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
