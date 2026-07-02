/** Unified review shape across all scraping sources */
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
