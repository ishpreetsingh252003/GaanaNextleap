import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult, SourceAdapterDiagnostics } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { searchPublicWebWithDiagnostics, toSourceAdapterDiagnostics } from "../services/webSearchProvider";

const WEB_NEWS_QUERIES = [
  "Gaana app recommendations repetitive",
  "Gaana music discovery reviews",
  "Gaana app user complaints recommendations",
  "Gaana playlist same songs",
  "Gaana same songs recommendations",
];

export async function scrapeWebNews(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();
  let rawResultCount = 0;
  let lastDiagnostics: SourceAdapterDiagnostics | undefined;

  try {
    for (const query of WEB_NEWS_QUERIES) {
      const { results, diagnostics } = await searchPublicWebWithDiagnostics(query, 5);
      rawResultCount += diagnostics.rawResultCount;
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
      lastDiagnostics = toSourceAdapterDiagnostics("web_news", {
        ...diagnostics,
        rawResultCount,
        normalizedResultCount: reviews.length,
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
    finalReason,
  };
}
