import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { searchPublicWeb } from "../services/webSearchProvider";

const COMMUNITY_QUERIES = [
  "site:quora.com Gaana app recommendations",
  "site:quora.com Gaana music app review",
  "site:quora.com Gaana vs Spotify recommendations",
];

export async function scrapeQuora(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();

  try {
    for (const query of COMMUNITY_QUERIES) {
      const results = await searchPublicWeb(query, 8);
      for (const result of results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        const date = normalizeReviewDate(result.date) || normalizeReviewDate(new Date())!;
        if (!isWithinRange(date, fromDate, toDate)) continue;
        reviews.push({
          id: uuid(),
          source: "quora",
          rating: null,
          title: result.title,
          text: result.snippet,
          author: "community_result",
          date,
          url: result.url,
          lang: "en",
        });
      }
    }

    return {
      source: "quora",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "community_search_returned_empty" : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      source: "quora",
      fetched: 0,
      reviews: [],
      error: msg.includes("missing_web_search_api_key")
        ? "missing_web_search_api_key"
        : msg.includes("missing_web_search_provider") ? "missing_web_search_provider" : "community_search_failed",
    };
  }
}
