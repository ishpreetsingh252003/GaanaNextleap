/**
 * Apple App Store review fetcher.
 * Uses Apple's public RSS customer reviews endpoint when APP_STORE_APP_ID is configured.
 */
import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult, SourceAdapterDiagnostics } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { fetchWithRetry, sleep } from "../utils/http";
import { describeShape } from "../services/webSearchProvider";

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

export function getAppStoreRssEntries(feed: any): AppStoreRssEntry[] {
  const entry = feed?.feed?.entry;
  if (!entry) return [];
  return Array.isArray(entry) ? entry : [entry];
}

export function parseAppStoreRssReviews(feed: any, appId: string, country = (process.env.APP_STORE_COUNTRY || "in").toLowerCase()): Review[] {
  const entries = getAppStoreRssEntries(feed);

  return entries
    .map((entry: AppStoreRssEntry): Review | null => {
      const body = entry.content?.label?.trim() || "";
      const title = entry.title?.label?.trim() || "";
      const rating = Number(entry["im:rating"]?.label);
      const date = normalizeReviewDate(entry.updated?.label);
      const id = entry.id?.label || uuid();

      if (!body || !entry["im:rating"]?.label) return null;

      return {
        id,
        source: "app_store" as const,
        rating: Number.isFinite(rating) ? rating : null,
        title,
        text: body,
        author: entry.author?.name?.label || "App Store user",
        date: date || new Date().toISOString().slice(0, 10),
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
  const appId = process.env.APP_STORE_APP_ID || "";
  const country = (process.env.APP_STORE_COUNTRY || "in").toLowerCase();
  if (!appId) {
    return {
      source: "app_store",
      fetched: 0,
      reviews: [],
      error: "missing_app_store_app_id",
      diagnostics: buildAppStoreDiagnostics({
        apiAttempted: false,
        finalReason: "missing_app_store_app_id",
      }),
    };
  }

  const reviews: Review[] = [];
  let lastDiagnostics = buildAppStoreDiagnostics({ apiAttempted: false, finalReason: "rss_fetch_failed" });
  let totalEntries = 0;
  let totalReviewLikeEntries = 0;
  let totalParsed = 0;

  try {
    for (let page = 0; page <= MAX_PAGES; page++) {
      await sleep(DELAY_MS);
      const pagePrefix = page === 0 ? "" : `/page=${page}`;
      const url = `https://itunes.apple.com/${country}/rss/customerreviews${pagePrefix}/id=${appId}/sortBy=mostRecent/json`;
      const response = await fetchWithRetry(url, {
        headers: { Accept: "application/json" },
      }, 1);
      const entries = getAppStoreRssEntries(response.data);
      const reviewLikeEntries = entries.filter(isReviewLikeEntry);
      const parsed = parseAppStoreRssReviews(response.data, appId, country);
      totalEntries += entries.length;
      totalReviewLikeEntries += reviewLikeEntries.length;
      totalParsed += parsed.length;
      lastDiagnostics = buildAppStoreDiagnostics({
        apiAttempted: true,
        statusCode: response.status,
        rawResponseShape: describeShape(response.data),
        rssEntryCount: totalEntries,
        rssReviewLikeEntryCount: totalReviewLikeEntries,
        parsedReviewCount: totalParsed,
        finalReason: totalParsed === 0 ? appStoreEmptyReason(totalEntries, totalReviewLikeEntries) : "rss_fetch_succeeded",
      });

      const filtered = parsed.filter((review) => isWithinRange(review.date, fromDate, toDate));
      reviews.push(...filtered);
      console.log(`[AppStoreRSS] Page ${page}: raw=${parsed.length}, filtered=${filtered.length}`);
    }

    const finalReason = reviews.length === 0
      ? totalParsed === 0 ? appStoreEmptyReason(totalEntries, totalReviewLikeEntries) : "rss_returned_empty"
      : "rss_fetch_succeeded";
    return {
      source: "app_store",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? finalReason : undefined,
      diagnostics: {
        ...lastDiagnostics,
        normalizedResultCount: reviews.length,
        finalReason,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AppStoreRSS] Fetch failed:", msg);
    const anyErr = err as any;
    return {
      source: "app_store",
      fetched: 0,
      reviews: [],
      error: "rss_fetch_failed",
      diagnostics: buildAppStoreDiagnostics({
        apiAttempted: true,
        statusCode: anyErr?.response?.status ?? null,
        rawResponseShape: anyErr?.response?.data ? describeShape(anyErr.response.data) : null,
        apiErrorType: anyErr?.response?.status ? "http_error" : "network_or_timeout",
        apiErrorMessageSafe: anyErr?.response?.status ? `HTTP ${anyErr.response.status}` : msg.slice(0, 120),
        finalReason: "rss_fetch_failed",
      }),
    };
  }
}

function appStoreEmptyReason(entryCount: number, reviewLikeEntryCount: number): string {
  if (entryCount === 0) return "rss_returned_empty";
  if (reviewLikeEntryCount === 0) return "rss_returned_no_review_entries";
  return "parser_returned_empty";
}

function isReviewLikeEntry(entry: AppStoreRssEntry): boolean {
  return Boolean(entry.content?.label && entry["im:rating"]?.label);
}

function buildAppStoreDiagnostics(input: {
  apiAttempted: boolean;
  statusCode?: number | null;
  rawResponseShape?: string | null;
  rssEntryCount?: number;
  rssReviewLikeEntryCount?: number;
  parsedReviewCount?: number;
  apiErrorType?: string | null;
  apiErrorMessageSafe?: string | null;
  finalReason: string;
}): SourceAdapterDiagnostics {
  const rawCount = input.rssEntryCount ?? 0;
  const parsedCount = input.parsedReviewCount ?? 0;
  return {
    source: "app_store",
    apiAttempted: input.apiAttempted,
    requestAttempted: input.apiAttempted,
    apiStatusCode: input.statusCode ?? null,
    apiErrorType: input.apiErrorType ?? null,
    apiErrorMessageSafe: input.apiErrorMessageSafe ?? null,
    rawResponseShape: input.rawResponseShape ?? null,
    rawResultCount: rawCount,
    normalizedResultCount: parsedCount,
    finalReason: input.finalReason,
    rssFetched: input.apiAttempted && !input.apiErrorType,
    rssStatusCode: input.statusCode ?? null,
    rssEntryCount: rawCount,
    rssReviewLikeEntryCount: input.rssReviewLikeEntryCount ?? 0,
    parsedReviewCount: parsedCount,
  };
}
