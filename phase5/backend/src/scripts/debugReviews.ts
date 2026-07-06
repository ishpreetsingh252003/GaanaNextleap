import {
  filterReviews,
  getFallbackReviewDataset,
  getFetcherType,
  ReviewFilters,
  VALID_REVIEW_SOURCES,
} from "../services/analysisService";
import { ReviewSource } from "../types/review";

const startDate = process.argv[2] || "2026-01-01";
const endDate = process.argv[3] || new Date().toISOString().slice(0, 10);
const dataset = getFallbackReviewDataset();

console.log(`Review corpus diagnostics (${startDate} to ${endDate})`);

for (const source of VALID_REVIEW_SOURCES) {
  const sourceRows = dataset.filter((review) => review.source === source);
  const filters: ReviewFilters = { sources: [source], startDate, endDate };
  const filtered = filterReviews(sourceRows, filters);
  const reason = readinessReason(source);

  console.log(
    [
      source,
      `fetcherType=${getFetcherType(source)}`,
      "live=0",
      `fallback=${sourceRows.length}`,
      `afterDate=${filtered.length}`,
      `final=${filtered.length}`,
      `reason=${reason}`,
    ].join(" | ")
  );
}

const filteredAll = filterReviews(dataset, {
  sources: VALID_REVIEW_SOURCES,
  startDate,
  endDate,
});

console.log(`total=${filteredAll.length}`);

function readinessReason(source: ReviewSource): string {
  if (source === "google_play") return "live_no_auth_available";
  if (source === "app_store") return process.env.APP_STORE_APP_ID ? "rss_fetch_configured" : "missing_app_store_app_id";
  if (source === "reddit") {
    return process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET
      ? "reddit_oauth_configured"
      : "reddit_auth_missing_public_fetch_available";
  }
  if (source === "web_news" || source === "quora") {
    if (process.env.WEB_SEARCH_PROVIDER && !process.env.WEB_SEARCH_API_KEY && !process.env.BRAVE_SEARCH_API_KEY && !process.env.TAVILY_API_KEY && !process.env.SERPAPI_API_KEY) {
      return "missing_web_search_api_key";
    }
    return process.env.WEB_SEARCH_API_KEY || process.env.BRAVE_SEARCH_API_KEY || process.env.TAVILY_API_KEY || process.env.SERPAPI_API_KEY
      ? "web_search_configured"
      : "missing_web_search_provider";
  }
  if (source === "twitter_web") {
    return process.env.X_BEARER_TOKEN ? "x_api_configured" : "x_bearer_token_missing_public_no_auth_unavailable";
  }
  return "unknown";
}
