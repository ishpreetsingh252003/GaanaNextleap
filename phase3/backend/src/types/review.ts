/** Unified review shape across all scraping sources */
export interface Review {
  id: string;
  source: ReviewSource;
  rating: number | null;       // 1-5, null for sources that don't have ratings (Reddit, Quora)
  title: string;
  text: string;
  author: string;
  date: string;                // ISO 8601
  url: string | null;
  lang: string;                // "en" | "hi" | "ta" | etc.
  // Set by cleaner
  cleaned_text?: string;
  pii_found?: boolean;
  cleaning_applied?: string[];
}

export type ReviewSource =
  | "google_play"
  | "app_store"
  | "reddit"
  | "quora"
  | "twitter_web"
  | "web_news";

export interface ScrapeResult {
  source: ReviewSource;
  fetched: number;
  reviews: Review[];
  error?: string;
}

export interface AggregatedResult {
  total: number;
  date_range: { from: string; to: string };
  sources: Record<ReviewSource, number>;
  reviews: Review[];
  errors: { source: ReviewSource; message: string }[];
}
