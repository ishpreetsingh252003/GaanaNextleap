import { createHash } from "crypto";
import { Review, ScrapeResult, SourceAdapterDiagnostics } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { searchPublicWebWithDiagnostics, toSourceAdapterDiagnostics } from "../services/webSearchProvider";

const WEB_NEWS_QUERIES = [
  "Gaana app review",
  "Gaana music app review",
  "Gaana app complaints",
  "Gaana recommendations problem",
  "Gaana music discovery",
  "Gaana playlist recommendations",
  "Gaana same songs recommendations",
  "Gaana vs Spotify recommendations",
  "Gaana app user reviews",
  "Gaana music streaming India reviews",
];

export async function scrapeWebNews(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();
  let rawResultCount = 0;
  let dateInferredCount = 0;
  let dateDroppedCount = 0;
  let lastDiagnostics: SourceAdapterDiagnostics | undefined;

  try {
    for (const query of WEB_NEWS_QUERIES) {
      const { results, diagnostics } = await searchPublicWebWithDiagnostics(query, 5);
      rawResultCount += diagnostics.rawResultCount;
      for (const result of results) {
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);
        const providerDate = normalizeReviewDate(result.date);
        const date = providerDate || normalizeReviewDate(new Date())!;
        if (!providerDate) dateInferredCount++;
        if (!isWithinRange(date, fromDate, toDate)) {
          dateDroppedCount++;
          continue;
        }
        const text = (result.snippet || result.title || "").trim();
        if (!result.title || !text || !result.url) continue;
        const id = `web-news-${hashStableId(`${result.url}:${result.title}`)}`;
        reviews.push({
          id,
          review_id: id,
          source: "web_news",
          platform: "web_news",
          rating: null,
          title: result.title,
          text,
          body: text,
          author: "public_web_result",
          date,
          dateSource: providerDate ? "provider" : "inferred_current_date",
          url: result.url,
          lang: "en",
        });
      }
      lastDiagnostics = toSourceAdapterDiagnostics("web_news", {
        ...diagnostics,
        rawResultCount,
        normalizedResultCount: reviews.length,
        queriesAttempted: WEB_NEWS_QUERIES,
        sourceFilteredCount: seenUrls.size,
        dateInferredCount,
        dateDroppedCount,
        finalAfterDateFilterCount: reviews.length,
      }, reviews.length === 0 ? "web_search_no_results" : "web_search_succeeded");
    }

    return {
      source: "web_news",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "web_search_no_results" : undefined,
      diagnostics: lastDiagnostics ?? buildFallbackDiagnostics("web_search_no_results"),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const errWithDiagnostics = err as Error & { diagnostics?: any };
    const finalReason = msg.includes("missing_web_search_api_key")
      ? "missing_web_search_api_key"
      : msg.includes("missing_web_search_provider") ? "missing_web_search_provider" : "web_search_failed";
    return {
      source: "web_news",
      fetched: 0,
      reviews: [],
      error: finalReason,
      diagnostics: errWithDiagnostics.diagnostics
        ? toSourceAdapterDiagnostics("web_news", errWithDiagnostics.diagnostics, finalReason)
        : buildFallbackDiagnostics(finalReason),
    };
  }
}

function buildFallbackDiagnostics(finalReason: string): SourceAdapterDiagnostics {
  return {
    source: "web_news",
    apiAttempted: !finalReason.startsWith("missing_web_search"),
    requestAttempted: !finalReason.startsWith("missing_web_search"),
    apiStatusCode: null,
    apiErrorType: finalReason.startsWith("missing_web_search") ? "configuration" : "unknown",
    apiErrorMessageSafe: finalReason,
    rawResponseShape: null,
    rawResultCount: 0,
    normalizedResultCount: 0,
    queriesAttempted: WEB_NEWS_QUERIES,
    sourceFilteredCount: 0,
    dateInferredCount: 0,
    dateDroppedCount: 0,
    finalAfterDateFilterCount: 0,
    finalReason,
  };
}

function hashStableId(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}
