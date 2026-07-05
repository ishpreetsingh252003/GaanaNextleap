/**
 * Apple App Store review fetcher.
 * Uses Apple's public RSS customer reviews endpoint when APP_STORE_APP_ID is configured.
 */
import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { fetchWithRetry, sleep } from "../utils/http";

const APP_ID = process.env.APP_STORE_APP_ID || "";
const COUNTRY = (process.env.APP_STORE_COUNTRY || "in").toLowerCase();
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "250", 10);
const MAX_PAGES = parseInt(process.env.APP_STORE_RSS_PAGES || "2", 10);

interface AppStoreRssEntry {
  id?: { label?: string };
  title?: { label?: string };
  content?: { label?: string };
  updated?: { label?: string };
  "im:rating"?: { label?: string };
  author?: { name?: { label?: string } };
}

export function parseAppStoreRssReviews(feed: any, appId: string, country = COUNTRY): Review[] {
  const entries = Array.isArray(feed?.feed?.entry) ? feed.feed.entry : [];

  return entries
    .map((entry: AppStoreRssEntry) => {
      const body = entry.content?.label?.trim() || "";
      const title = entry.title?.label?.trim() || "";
      const rating = Number(entry["im:rating"]?.label);
      const date = normalizeReviewDate(entry.updated?.label);
      const id = entry.id?.label || uuid();

      if (!body || !date || !entry["im:rating"]?.label) return null;

      return {
        id,
        source: "app_store" as const,
        rating: Number.isFinite(rating) ? rating : null,
        title,
        text: body,
        author: entry.author?.name?.label || "App Store user",
        date,
        url: `https://apps.apple.com/${country}/app/id${appId}`,
        lang: "en",
      };
    })
    .filter((review: Review | null): review is Review => Boolean(review));
}

export async function scrapeAppStore(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  if (!APP_ID) {
    return {
      source: "app_store",
      fetched: 0,
      reviews: [],
      error: "missing_app_store_app_id",
    };
  }

  const reviews: Review[] = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      await sleep(DELAY_MS);
      const pagePrefix = page === 1 ? "" : `/page=${page}`;
      const url = `https://itunes.apple.com/${COUNTRY}/rss/customerreviews${pagePrefix}/id=${APP_ID}/sortBy=mostRecent/json`;
      const response = await fetchWithRetry(url, {
        headers: { Accept: "application/json" },
      }, 1);
      const parsed = parseAppStoreRssReviews(response.data, APP_ID, COUNTRY);

      if (parsed.length === 0 && page === 1) {
        return {
          source: "app_store",
          fetched: 0,
          reviews: [],
          error: "parser_returned_empty",
        };
      }

      const filtered = parsed.filter((review) => isWithinRange(review.date, fromDate, toDate));
      reviews.push(...filtered);
      console.log(`[AppStoreRSS] Page ${page}: raw=${parsed.length}, filtered=${filtered.length}`);
      if (parsed.length === 0) break;
    }

    return {
      source: "app_store",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "rss_returned_empty" : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AppStoreRSS] Fetch failed:", msg);
    return { source: "app_store", fetched: 0, reviews: [], error: "rss_fetch_failed" };
  }
}
