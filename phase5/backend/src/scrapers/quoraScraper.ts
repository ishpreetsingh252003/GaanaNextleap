import { randomUUID as uuid } from "crypto";
import { Review, ScrapeResult, SourceAdapterDiagnostics } from "../types/review";
import { isWithinRange, normalizeReviewDate, SCRAPE_FROM } from "../utils/dateFilter";
import { searchPublicWebWithDiagnostics, toSourceAdapterDiagnostics } from "../services/webSearchProvider";

const COMMUNITY_QUERIES = [
  "site:quora.com Gaana music app",
  "site:quora.com Gaana app recommendations",
  "site:quora.com Gaana vs Spotify recommendations",
  "site:quora.com Gaana app review",
];

export async function scrapeQuora(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();
  let rawResultCount = 0;
  let lastDiagnostics: SourceAdapterDiagnostics | undefined;

  try {
    for (const query of COMMUNITY_QUERIES) {
      const { results, diagnostics } = await searchPublicWebWithDiagnostics(query, 5);
      rawResultCount += diagnostics.rawResultCount;
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
      lastDiagnostics = toSourceAdapterDiagnostics("quora", {
        ...diagnostics,
        rawResultCount,
        normalizedResultCount: reviews.length,
      }, reviews.length === 0 ? "community_search_no_results" : "community_search_succeeded");
    }

    return {
      source: "quora",
      fetched: reviews.length,
      reviews,
      error: reviews.length === 0 ? "community_search_no_results" : undefined,
      diagnostics: lastDiagnostics ?? buildFallbackDiagnostics("community_search_no_results"),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const errWithDiagnostics = err as Error & { diagnostics?: any };
    const finalReason = msg.includes("missing_web_search_api_key")
      ? "missing_web_search_api_key"
      : msg.includes("missing_web_search_provider") ? "missing_web_search_provider" : "community_search_failed";
    return {
      source: "quora",
      fetched: 0,
      reviews: [],
      error: finalReason,
      diagnostics: errWithDiagnostics.diagnostics
        ? toSourceAdapterDiagnostics("quora", errWithDiagnostics.diagnostics, finalReason)
        : buildFallbackDiagnostics(finalReason),
    };
  }
}

function buildFallbackDiagnostics(finalReason: string): SourceAdapterDiagnostics {
  return {
    source: "quora",
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
