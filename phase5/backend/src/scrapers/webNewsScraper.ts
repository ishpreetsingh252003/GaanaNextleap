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
  "Gaana app not recommending songs",
  "Gaana app same songs",
  "Gaana app recommendation issue",
  "Gaana app playlist issue",
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
  let missingTitleOrBodyRemoved = 0;
  let duplicateRemoved = 0;
  const sampleResults: SourceAdapterDiagnostics["sampleResults"] = [];
  let lastDiagnostics: SourceAdapterDiagnostics | undefined;

  try {
    for (const query of WEB_NEWS_QUERIES) {
      const { results, diagnostics } = await searchPublicWebWithDiagnostics(query, 5);
      rawResultCount += diagnostics.rawResultCount;
      for (const result of results) {
        if (sampleResults.length < 3) {
          sampleResults.push({
            title: result.title || "",
            url: result.url || "",
            hasSnippet: Boolean(result.snippet),
          });
        }
        const url = result.url?.trim();
        const title = result.title?.trim();
        const text = (result.snippet || result.title || "").trim();
        if (!url || !title || !text) {
          missingTitleOrBodyRemoved++;
          continue;
        }
        const dedupeKey = normalizeUrl(url) || `${title}:${text}`.toLowerCase();
        if (seenUrls.has(dedupeKey)) {
          duplicateRemoved++;
          continue;
        }
        seenUrls.add(dedupeKey);
        const providerDate = normalizeReviewDate(result.date);
        const date = providerDate || normalizeReviewDate(new Date())!;
        if (!providerDate) dateInferredCount++;
        if (!isWithinRange(date, fromDate, toDate)) {
          dateDroppedCount++;
          continue;
        }
        const id = `web-news-${hashStableId(`${url}:${title}`)}`;
        reviews.push({
          id,
          review_id: id,
          source: "web_news",
          platform: "web_news",
          rating: null,
          title,
          text,
          body: text,
          author: "public_web_result",
          date,
          dateSource: providerDate ? "provider" : "inferred_current_date",
          url,
          lang: "en",
        });
      }
      const stageDiagnostics = buildStageDiagnostics({
        rawResultCount,
        afterUrlFilterCount: rawResultCount,
        afterTitleSnippetFilterCount: rawResultCount - missingTitleOrBodyRemoved,
        afterDedupeCount: seenUrls.size,
        finalLiveCount: reviews.length,
        dateInferredCount,
        dateDroppedCount,
        missingTitleOrBodyRemoved,
        duplicateRemoved,
        sampleResults,
      });
      lastDiagnostics = toSourceAdapterDiagnostics("web_news", {
        ...diagnostics,
        rawResultCount,
        normalizedResultCount: reviews.length,
        queriesAttempted: WEB_NEWS_QUERIES,
        sourceFilteredCount: rawResultCount,
        dateInferredCount,
        dateDroppedCount,
        finalAfterDateFilterCount: reviews.length,
        ...stageDiagnostics,
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
    providerRawResultsCount: 0,
    afterUrlFilterCount: 0,
    afterTitleSnippetFilterCount: 0,
    afterNormalizationCount: 0,
    missingDateAssignedCount: 0,
    afterDateFilterCount: 0,
    afterDedupeCount: 0,
    finalLiveCount: 0,
    dropReasonBreakdown: emptyDropReasons(),
    sampleResults: [],
    finalReason,
  };
}

function hashStableId(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function normalizeUrl(url: string): string {
  return url.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
}

function buildStageDiagnostics(input: {
  rawResultCount: number;
  afterUrlFilterCount: number;
  afterTitleSnippetFilterCount: number;
  afterDedupeCount: number;
  finalLiveCount: number;
  dateInferredCount: number;
  dateDroppedCount: number;
  missingTitleOrBodyRemoved: number;
  duplicateRemoved: number;
  sampleResults: SourceAdapterDiagnostics["sampleResults"];
}) {
  return {
    providerRawResultsCount: input.rawResultCount,
    afterUrlFilterCount: input.afterUrlFilterCount,
    afterTitleSnippetFilterCount: input.afterTitleSnippetFilterCount,
    afterNormalizationCount: input.finalLiveCount,
    missingDateAssignedCount: input.dateInferredCount,
    afterDateFilterCount: input.finalLiveCount,
    afterDedupeCount: input.afterDedupeCount,
    finalLiveCount: input.finalLiveCount,
    dropReasonBreakdown: {
      url_filter_removed: input.rawResultCount - input.afterUrlFilterCount,
      missing_title_or_body_removed: input.missingTitleOrBodyRemoved,
      date_filter_removed: input.dateDroppedCount,
      duplicate_removed: input.duplicateRemoved,
      other_removed: 0,
    },
    sampleResults: input.sampleResults,
  };
}

function emptyDropReasons() {
  return {
    url_filter_removed: 0,
    missing_title_or_body_removed: 0,
    date_filter_removed: 0,
    duplicate_removed: 0,
    other_removed: 0,
  };
}
