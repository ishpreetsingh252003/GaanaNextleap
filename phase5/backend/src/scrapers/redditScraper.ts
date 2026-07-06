import axios from "axios";
import { createHash, randomUUID as uuid } from "crypto";
import { searchPublicWebWithDiagnostics, toSourceAdapterDiagnostics, WebSearchResult } from "../services/webSearchProvider";
import { Review, ScrapeResult, SourceAdapterDiagnostics } from "../types/review";
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
const WEB_SEARCH_QUERIES = [
  "site:reddit.com Gaana app recommendations",
  "site:reddit.com Gaana same songs",
  "site:reddit.com Gaana music discovery",
  "site:reddit.com Gaana playlist",
  "site:reddit.com Gaana vs Spotify recommendations",
  "site:reddit.com/r/india Gaana music app",
  "site:reddit.com/r/IndianMusic Gaana recommendations",
  "site:reddit.com Gaana app review music",
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
        diagnostics: buildBasicDiagnostics("reddit_oauth_succeeded", true, reviews.length, reviews.length),
        error: reviews.length === 0 ? "reddit_oauth_returned_empty" : undefined,
      };
  } catch (oauthErr) {
    const oauthMessage = oauthErr instanceof Error ? oauthErr.message : String(oauthErr);
    if (oauthMessage !== "reddit_credentials_missing") {
      console.warn("[Reddit] OAuth path failed:", oauthMessage);
    }

    const webSearchReason =
      oauthMessage === "reddit_credentials_missing"
        ? "reddit_auth_missing_using_web_search"
        : "reddit_oauth_failed_using_web_search";

    try {
      const { reviews, diagnostics } = await searchRedditWebWithDiagnostics(fromDate, toDate);
      return {
        source: "reddit",
        fetched: reviews.length,
        reviews,
        diagnostics: {
          ...diagnostics,
          finalReason: reviews.length > 0 ? "reddit_web_search_succeeded" : "reddit_web_search_no_results",
        },
        error: reviews.length > 0 ? webSearchReason : "reddit_web_search_no_results",
      };
    } catch (webErr) {
      const webMessage = webErr instanceof Error ? webErr.message : String(webErr);
      if (!["missing_web_search_provider", "missing_web_search_api_key", "reddit_web_search_no_results"].includes(webMessage)) {
        console.warn("[Reddit] Web search path failed:", webMessage);
      }
    }

    try {
      const reviews = await searchRedditPublic(fromDate, toDate);
      return {
        source: "reddit",
        fetched: reviews.length,
        reviews,
        diagnostics: buildBasicDiagnostics(
          reviews.length > 0 ? "reddit_public_json_succeeded" : "reddit_auth_missing_public_fetch_limited",
          true,
          reviews.length,
          reviews.length
        ),
        error: reviews.length > 0 ? "reddit_public_json_succeeded" : "reddit_auth_missing_public_fetch_limited",
      };
    } catch (publicErr) {
      const publicMessage = publicErr instanceof Error ? publicErr.message : String(publicErr);
      console.warn("[Reddit] Public JSON path failed:", publicMessage);
      return {
        source: "reddit",
        fetched: 0,
        reviews: [],
        diagnostics: buildBasicDiagnostics("reddit_auth_missing_public_fetch_limited", true, 0, 0, "network_or_timeout", publicMessage.slice(0, 120)),
        error: "reddit_auth_missing_public_fetch_limited",
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

export async function searchRedditWeb(fromDate: Date, toDate: Date): Promise<Review[]> {
  const { reviews } = await searchRedditWebWithDiagnostics(fromDate, toDate);
  return reviews;
}

export async function searchRedditWebWithDiagnostics(
  fromDate: Date,
  toDate: Date
): Promise<{ reviews: Review[]; diagnostics: SourceAdapterDiagnostics }> {
  const results: WebSearchResult[] = [];
  let rawResultCount = 0;
  let lastDiagnostics: SourceAdapterDiagnostics | undefined;
  for (const query of WEB_SEARCH_QUERIES) {
    const response = await searchPublicWebWithDiagnostics(query, 5);
    results.push(...response.results);
    rawResultCount += response.diagnostics.rawResultCount;
    lastDiagnostics = toSourceAdapterDiagnostics("reddit", {
      ...response.diagnostics,
      rawResultCount,
      normalizedResultCount: results.length,
    }, "reddit_auth_missing_using_web_search");
  }
  const reviews = normalizeRedditSearchResults(results, fromDate, toDate);
  if (reviews.length === 0) throw new Error("reddit_web_search_no_results");
  return {
    reviews,
    diagnostics: {
      ...(lastDiagnostics ?? buildBasicDiagnostics("reddit_web_search_no_results", true, rawResultCount, 0)),
      normalizedResultCount: reviews.length,
      finalReason: "reddit_web_search_succeeded",
    },
  };
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

export function normalizeRedditSearchResults(
  results: WebSearchResult[],
  fromDate: Date,
  toDate: Date
): Review[] {
  const seen = new Set<string>();
  const reviews: Review[] = [];
  const fallbackDate = normalizeReviewDate(Date.now()) || new Date().toISOString().slice(0, 10);

  for (const result of results) {
    const url = result.url?.trim();
    const title = result.title?.trim();
    const text = (result.snippet || title || "").trim();
    if (!url || !title || !text || !url.includes("reddit.com")) continue;

    const dedupeKey = normalizeRedditUrl(url) || title.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const date = normalizeReviewDate(result.date || "") || fallbackDate;
    if (!isWithinRange(date, fromDate, toDate)) continue;

    reviews.push({
      id: `reddit-web-${hashStableId(dedupeKey)}`,
      source: "reddit",
      rating: null,
      title,
      text,
      author: "Public Reddit search result",
      date,
      url,
      lang: "en",
    });
  }

  return reviews;
}

function normalizeRedditUrl(url: string): string {
  return url.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
}

function hashStableId(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function buildBasicDiagnostics(
  finalReason: string,
  apiAttempted: boolean,
  rawResultCount: number,
  normalizedResultCount: number,
  apiErrorType: string | null = null,
  apiErrorMessageSafe: string | null = null
): SourceAdapterDiagnostics {
  return {
    source: "reddit",
    apiAttempted,
    requestAttempted: apiAttempted,
    apiStatusCode: null,
    apiErrorType,
    apiErrorMessageSafe,
    rawResponseShape: null,
    rawResultCount,
    normalizedResultCount,
    finalReason,
  };
}
