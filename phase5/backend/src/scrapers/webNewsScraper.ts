import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { searchPublicWeb } from "../services/webSearchProvider";

const WEB_NEWS_QUERIES = [
  "Gaana music discovery reviews",
  "Gaana app recommendations repetitive",
  "Gaana playlist same songs",
  "Gaana app user complaints recommendations",
];

export async function scrapeWebNews(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();

  try {
    for (const query of WEB_NEWS_QUERIES) {
      const results = await searchPublicWeb(query, 8);
      for (const result of results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        const date = normalizeReviewDate(result.date) || normalizeReviewDate(new Date())!;
        if (!isWithinRange(date, fromDate, toDate)) continue;
        reviews.push({
          id: uuid(),
          source: "web_news",
          rating: null,
          title: result.title,
          text: result.snippet,
          author: "public_web_result",
          date,
          url: result.url,
          lang: "en",
        });
      }
    }

    return {
      source: "web_news",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "web_search_returned_empty" : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      source: "web_news",
      fetched: 0,
      reviews: [],
      error: msg.includes("missing_web_search_provider") ? "missing_web_search_provider" : "web_search_failed",
    };
  }
}
