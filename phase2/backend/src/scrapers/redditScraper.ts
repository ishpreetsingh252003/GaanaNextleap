/**
 * Reddit scraper
 * Uses Reddit's public JSON API (no auth required for public posts).
 * Searches multiple relevant subreddits for Gaana-related posts & comments.
 * Stays within Reddit's public API rate limits (no OAuth needed for reads).
 */
import { fetchWithRetry, sleep } from "../utils/http";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, toISO } from "../utils/dateFilter";
import { randomUUID as uuid } from "crypto";

const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "1500", 10);
const MAX_PAGES = parseInt(process.env.MAX_PAGES_PER_SOURCE || "5", 10);

/** Subreddits and search queries relevant to Gaana */
const SEARCH_TARGETS = [
  { sub: "india", query: "Gaana app music" },
  { sub: "bollywood", query: "Gaana" },
  { sub: "IndianMusicStreaming", query: "Gaana" },
  { sub: "gaana", query: "" },                      // dedicated subreddit if it exists
  { sub: "androidapps", query: "Gaana app" },
  { sub: "iosapps", query: "Gaana" },
  { sub: "musicstreaming", query: "Gaana India" },
];

interface RedditPost {
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  permalink: string;
  score: number;
}

async function fetchSubredditSearch(
  subreddit: string,
  query: string,
  after: string | null
): Promise<{ posts: RedditPost[]; after: string | null }> {
  const base = query
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : `https://www.reddit.com/r/${subreddit}/new.json`;

  const params = new URLSearchParams({
    q: query,
    sort: "new",
    t: "year",
    limit: "25",
    restrict_sr: "1",
  });
  if (!query) params.delete("q");
  if (!query) params.delete("restrict_sr");
  if (after) params.set("after", after);

  const url = `${base}?${params.toString()}`;
  const res = await fetchWithRetry(url, {
    headers: {
      "User-Agent": process.env.REDDIT_USER_AGENT || "GaanaDiscoveryAI/2.0",
    },
  });

  const children = res.data?.data?.children ?? [];
  const nextAfter = res.data?.data?.after ?? null;
  const posts: RedditPost[] = children
    .filter((c: any) => c.kind === "t3")
    .map((c: any) => c.data as RedditPost);

  return { posts, after: nextAfter };
}

export async function scrapeReddit(): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenIds = new Set<string>();

  try {
    for (const target of SEARCH_TARGETS) {
      let afterToken: string | null = null;

      for (let page = 0; page < MAX_PAGES; page++) {
        await sleep(DELAY_MS);

        const { posts, after } = await fetchSubredditSearch(
          target.sub,
          target.query,
          afterToken
        );

        if (!posts.length) break;

        for (const post of posts) {
          const dateStr = toISO(post.created_utc * 1000);
          if (!isWithinRange(dateStr)) continue;

          const text = [post.title, post.selftext].filter(Boolean).join("\n").trim();
          if (!text || text.length < 10) continue;

          const uniqueKey = `${target.sub}::${post.permalink}`;
          if (seenIds.has(uniqueKey)) continue;
          seenIds.add(uniqueKey);

          reviews.push({
            id: uuid(),
            source: "reddit",
            rating: null,
            title: post.title,
            text: post.selftext || post.title,
            author: post.author || "redditor",
            date: dateStr,
            url: `https://reddit.com${post.permalink}`,
            lang: "en",
          });
        }

        afterToken = after;
        if (!afterToken) break;
      }

      console.log(
        `[Reddit] r/${target.sub} "${target.query}": ${reviews.length} total so far`
      );
    }

    return { source: "reddit", fetched: reviews.length, reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Reddit] Scrape failed:", msg);
    return { source: "reddit", fetched: 0, reviews: [], error: msg };
  }
}
