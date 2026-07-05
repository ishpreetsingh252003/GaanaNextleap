import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { fetchWithRetry } from "../utils/http";

const SEARCH_QUERIES = [
  '"Gaana app" recommendations',
  '"Gaana" "same songs"',
  '"Gaana" playlist',
  '"Gaana" "music discovery"',
];

export async function scrapeTwitter(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return {
      source: "twitter_web",
      fetched: 0,
      reviews: [],
      error: "x_bearer_token_missing_public_no_auth_unavailable",
    };
  }

  const reviews: Review[] = [];
  const seen = new Set<string>();

  try {
    for (const query of SEARCH_QUERIES) {
      const params = new URLSearchParams({
        query: `${query} lang:en -is:retweet`,
        max_results: "25",
        "tweet.fields": "created_at,public_metrics",
      });
      const response = await fetchWithRetry(`https://api.twitter.com/2/tweets/search/recent?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }, 1);

      for (const tweet of response.data?.data ?? []) {
        if (seen.has(tweet.id)) continue;
        seen.add(tweet.id);
        const date = normalizeReviewDate(tweet.created_at);
        if (!date || !isWithinRange(date, fromDate, toDate)) continue;

        reviews.push({
          id: tweet.id || uuid(),
          source: "twitter_web",
          rating: null,
          title: "",
          text: tweet.text || "",
          author: "x_public_post",
          date,
          url: `https://x.com/i/web/status/${tweet.id}`,
          lang: "en",
        });
      }
    }

    return {
      source: "twitter_web",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "x_api_returned_empty" : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[X] API fetch failed:", msg);
    return { source: "twitter_web", fetched: 0, reviews: [], error: "x_api_failed" };
  }
}
