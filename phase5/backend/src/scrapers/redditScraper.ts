import axios from "axios";
import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { fetchWithRetry } from "../utils/http";

const USER_AGENT = process.env.REDDIT_USER_AGENT || "GaanaNextLeapReviewEngine/1.0";
const QUERIES = [
  "Gaana app recommendations",
  "Gaana same songs",
  "Gaana music discovery",
  "Gaana playlist",
  "Gaana app review",
  "Gaana recommendations repetitive",
];

interface RedditPost {
  id?: string;
  title?: string;
  selftext?: string;
  author?: string;
  created_utc?: number;
  permalink?: string;
  score?: number;
  subreddit?: string;
}

export async function getRedditOAuthToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("reddit_credentials_missing");

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await axios.post("https://www.reddit.com/api/v1/access_token", body.toString(), {
    auth: { username: clientId, password: clientSecret },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    timeout: 8000,
  });
  if (!response.data?.access_token) throw new Error("reddit_oauth_failed");
  return response.data.access_token;
}

export async function scrapeReddit(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  try {
    const token = await getRedditOAuthToken();
    const reviews = await searchRedditOAuth(token, fromDate, toDate);
    return {
      source: "reddit",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "reddit_oauth_returned_empty" : undefined,
    };
  } catch (oauthErr) {
    const oauthMessage = oauthErr instanceof Error ? oauthErr.message : String(oauthErr);
    if (oauthMessage !== "reddit_credentials_missing") {
      console.warn("[Reddit] OAuth path failed:", oauthMessage);
    }

    try {
      const reviews = await searchRedditPublic(fromDate, toDate);
      return {
        source: "reddit",
        fetched: reviews.length,
        reviews,
        error: reviews.length > 0 ? "reddit_auth_missing_public_fetch_used" : "reddit_auth_missing_or_public_fetch_limited",
      };
    } catch (publicErr) {
      const publicMessage = publicErr instanceof Error ? publicErr.message : String(publicErr);
      console.warn("[Reddit] Public JSON path failed:", publicMessage);
      return {
        source: "reddit",
        fetched: 0,
        reviews: [],
        error: "reddit_auth_missing_or_public_fetch_limited",
      };
    }
  }
}

async function searchRedditOAuth(token: string, fromDate: Date, toDate: Date): Promise<Review[]> {
  const posts: RedditPost[] = [];
  for (const query of QUERIES) {
    const params = new URLSearchParams({
      q: query,
      sort: "new",
      t: "year",
      limit: "25",
    });
    const response = await fetchWithRetry(`https://oauth.reddit.com/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT,
      },
    }, 1);
    posts.push(...extractPosts(response.data));
  }
  return normalizeRedditPosts(posts, fromDate, toDate);
}

async function searchRedditPublic(fromDate: Date, toDate: Date): Promise<Review[]> {
  const posts: RedditPost[] = [];
  for (const query of QUERIES.slice(0, 3)) {
    const params = new URLSearchParams({
      q: query,
      sort: "new",
      t: "year",
      limit: "25",
    });
    const response = await fetchWithRetry(`https://www.reddit.com/search.json?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT },
    }, 0);
    posts.push(...extractPosts(response.data));
  }
  return normalizeRedditPosts(posts, fromDate, toDate);
}

function extractPosts(data: any): RedditPost[] {
  const children = data?.data?.children ?? [];
  return children
    .filter((child: any) => child.kind === "t3")
    .map((child: any) => child.data as RedditPost);
}

function normalizeRedditPosts(posts: RedditPost[], fromDate: Date, toDate: Date): Review[] {
  const seen = new Set<string>();
  const reviews: Review[] = [];

  for (const post of posts) {
    const id = post.id || post.permalink || uuid();
    if (seen.has(id)) continue;
    seen.add(id);
    const date = normalizeReviewDate((post.created_utc ?? 0) * 1000);
    if (!date || !isWithinRange(date, fromDate, toDate)) continue;
    const text = [post.title, post.selftext].filter(Boolean).join("\n").trim();
    if (!text || text.length < 5) continue;

    reviews.push({
      id,
      source: "reddit",
      rating: null,
      title: post.title || "",
      text: post.selftext || post.title || "",
      author: post.author || "redditor",
      date,
      url: post.permalink ? `https://reddit.com${post.permalink}` : "https://reddit.com",
      lang: "en",
    });
  }

  return reviews;
}
