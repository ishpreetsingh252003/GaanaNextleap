import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { Review } from "../types/review";
import { runScraping, ScraperKey } from "../services/scrapeOrchestrator";
import {
  buildAnalysisMetadata,
  buildGroqChunks,
  buildStratifiedReviewSample,
  buildReliableFallbackAnalysis,
  buildZeroMatchPayload,
  countInvalidDates,
  filterReviews,
  getFetcherType,
  getFallbackReviewDataset,
  normalizeSource,
  shapeAnalysisResponse,
  sourceLabel,
  SourceDiagnostic,
  validateAnalysisResult,
  VALID_REVIEW_SOURCES,
} from "../services/analysisService";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;
const SOURCE_FETCH_TIMEOUT_MS = 6_000;
const GROQ_STAGE_TIMEOUT_MS = 12_000;
const MIN_LIVE_SOURCE_COUNT = 10;

// POST /api/analysis/review-analysis
router.post("/review-analysis", async (req: Request, res: Response) => {
  const { reviews, useFallback, collectSources, sources, startDate, endDate } = req.body as {
    reviews?: Review[];
    useFallback?: boolean;
    collectSources?: boolean;
    sources?: string[];
    startDate?: string;
    endDate?: string;
  };

  const selectedSources = normalizeRequestedSources(sources);
  const filters = {
    sources: useFallback ? VALID_REVIEW_SOURCES : selectedSources,
    startDate: useFallback ? "2026-01-01" : startDate,
    endDate: useFallback ? toDateOnly(new Date()) : endDate,
  };
  const { reviews: sourceDataset, diagnostics: sourceDiagnostics } = await resolveReviewDataset({
    reviews,
    useFallback,
    collectSources,
    selectedSources: filters.sources,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const filteredReviews = filterReviews(sourceDataset, filters);
  const totalReviews = filteredReviews.length;

  if (totalReviews === 0) {
    return res.json({
      ...buildZeroMatchPayload(filters),
      sourceDiagnostics,
    });
  }

  if (useFallback === true) {
    const fallbackAnalysis = buildReliableFallbackAnalysis(filteredReviews, filters);
    const response = shapeAnalysisResponse(fallbackAnalysis, filteredReviews, filters, true);
    response.message = `Showing representative reviews from ${totalReviews} demo feedback entries across all sources.`;
    (response as any).sourceDiagnostics = sourceDiagnostics;
    response.analysis.message = response.message;
    response.analysis.analysisMode = "demo";
    response.analysis.analysis_mode = "demo";
    return res.json(response);
  }

  // All filtered reviews are counted. Groq receives stratified/chunked evidence so larger datasets are represented without exceeding free-tier/token limits.
  const groqSample = buildStratifiedReviewSample(filteredReviews);
  const groqChunks = buildGroqChunks(groqSample);

  try {
    console.log(
      `[AnalysisRoute] Starting staged Groq analysis. filtered=${totalReviews}, sample=${groqSample.length}, chunks=${groqChunks.length}`
    );

    const stageOutputs = [];
    for (let i = 0; i < groqChunks.length; i++) {
      const stageA = await withTimeout(
        groqService.discoverReviewThemes(groqChunks[i], {
          chunkIndex: i,
          totalChunks: groqChunks.length,
          totalReviews,
        }),
        GROQ_STAGE_TIMEOUT_MS
      );
      stageOutputs.push(stageA);
    }

    const metadata = buildAnalysisMetadata(filteredReviews, filters);
    let analysis = await withTimeout(
      groqService.synthesizeReviewInsights(stageOutputs, groqSample, metadata),
      GROQ_STAGE_TIMEOUT_MS
    );

    if (!isValidAnalysis(analysis) || !validateAnalysisResult(analysis, filteredReviews)) {
      analysis = await withTimeout(
        groqService.synthesizeReviewInsights(stageOutputs, groqSample, { ...metadata, repair: true }),
        GROQ_STAGE_TIMEOUT_MS
      );
    }

    if (!isValidAnalysis(analysis) || !validateAnalysisResult(analysis, filteredReviews)) {
      throw new Error("AI analysis response was incomplete after repair.");
    }

    const response = shapeAnalysisResponse(analysis, filteredReviews, filters, false);
    (response as any).sourceDiagnostics = sourceDiagnostics;
    if (sourceDataset.some((review) => review.id.startsWith("fallback-") || review.author === "Public feedback")) {
      response.message = "Some public sources were limited, so reliable review data was used for those sources.";
      response.analysis.message = response.message;
      response.analysis.analysisMode = "mixed";
      response.analysis.analysis_mode = "mixed";
    }
    return res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[AnalysisRoute] AI analysis unavailable; returning reliable fallback.", msg);

    const fallbackAnalysis = buildReliableFallbackAnalysis(filteredReviews, filters);
    const response = shapeAnalysisResponse(fallbackAnalysis, filteredReviews, filters, true);
    response.message = "Some sources or AI calls were limited, so this run used reliable analysis from available feedback data.";
    (response as any).sourceDiagnostics = sourceDiagnostics;
    response.analysis.message = response.message;
    response.analysis.analysisMode = "reliable_analysis";
    response.analysis.analysis_mode = "reliable_analysis";
    return res.json(response);
  }
});

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("AI analysis timed out.")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

function isValidAnalysis(analysis: any): boolean {
  return Boolean(
    analysis &&
      typeof analysis.summary === "string" &&
      Array.isArray(analysis.themes) &&
      analysis.sentiment_summary &&
      typeof analysis.problem_statement === "string"
  );
}

function normalizeRequestedSources(sources?: string[]) {
  const normalized = sources
    ?.map(normalizeSource)
    .filter((source) => VALID_REVIEW_SOURCES.includes(source));
  return normalized?.length ? normalized : VALID_REVIEW_SOURCES;
}

async function resolveReviewDataset({
  reviews,
  useFallback,
  collectSources,
  selectedSources,
  startDate,
  endDate,
}: {
  reviews?: Review[];
  useFallback?: boolean;
  collectSources?: boolean;
  selectedSources: string[];
  startDate?: string;
  endDate?: string;
}): Promise<{ reviews: Review[]; diagnostics: SourceDiagnostic[] }> {
  if (useFallback) {
    const fallback = getFallbackReviewDataset();
    return {
      reviews: fallback,
      diagnostics: selectedSources.map((source) =>
        buildDiagnosticForSource(source as ScraperKey, [], fallback, {
          attemptedLiveFetch: false,
          reason: getFetcherType(source as ScraperKey) === "fallback_only" ? "public_no_auth_source_unavailable" : "full_demo_dataset",
        }, startDate, endDate)
      ),
    };
  }
  if (collectSources || !reviews || reviews.length === 0) {
    return collectReviewsWithSourceFallback(selectedSources as ScraperKey[], startDate, endDate);
  }

  const selected = selectedSources.map(normalizeSource);
  const liveSourceSet = new Set(reviews.map((review) => normalizeSource(review.source)));
  const fallbackDataset = getFallbackReviewDataset();
  const fallbackForMissingSources = fallbackDataset.filter((review) => {
    const source = normalizeSource(review.source);
    return selected.includes(source) && !liveSourceSet.has(source);
  });

  const combined = [...reviews, ...fallbackForMissingSources];
  return {
    reviews: combined,
    diagnostics: selected.map((source) =>
      buildDiagnosticForSource(source as ScraperKey, reviews, fallbackForMissingSources, {
        attemptedLiveFetch: reviews.some((review) => normalizeSource(review.source) === source),
        reason: liveSourceSet.has(source) ? "live_fetch_succeeded" : "fallback_used_for_source",
      }, startDate, endDate)
    ),
  };
}

async function collectReviewsWithSourceFallback(
  selectedSources: ScraperKey[],
  startDate?: string,
  endDate?: string
) : Promise<{ reviews: Review[]; diagnostics: SourceDiagnostic[] }> {
  const fromDate = startDate ? new Date(startDate) : undefined;
  const toDate = endDate ? new Date(endDate) : undefined;
  const fallbackDataset = getFallbackReviewDataset();

  const settled = await Promise.allSettled(
    selectedSources.map(async (source) => {
      if (getFetcherType(source) === "fallback_only") {
        throw new Error(reasonForMissingCredentialSource(source));
      }
      const result = await withTimeout(runScraping([source], fromDate, toDate), SOURCE_FETCH_TIMEOUT_MS);
      if (result.reviews.length === 0) {
        throw new Error(result.errors[0]?.message || "live_fetch_returned_empty");
      }
      return result.reviews;
    })
  );

  const diagnostics: SourceDiagnostic[] = [];
  const reviews = settled.flatMap((result, index) => {
    const source = selectedSources[index];
    const fallbackForSource = filterReviews(fallbackDataset, { sources: [source], startDate, endDate });
    if (result.status === "fulfilled") {
      return result.value.length >= MIN_LIVE_SOURCE_COUNT
        ? result.value
        : [...result.value, ...fallbackForSource];
    }
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.warn(`[AnalysisRoute] Source ${source} limited; using reliable review data.`);
    return fallbackForSource;
  });

  for (let index = 0; index < selectedSources.length; index++) {
    const source = selectedSources[index];
    const result = settled[index];
    const liveForSource = result.status === "fulfilled" ? result.value : [];
    const fallbackForSource = result.status === "fulfilled" && result.value.length >= MIN_LIVE_SOURCE_COUNT
      ? []
      : filterReviews(fallbackDataset, { sources: [source], startDate, endDate });
    const reason =
      result.status === "fulfilled"
        ? result.value.length >= MIN_LIVE_SOURCE_COUNT ? successReasonForSource(source) : "live_fetch_returned_limited"
        : reasonForFetchFailure(source, result.reason);
    diagnostics.push(
      buildDiagnosticForSource(source, liveForSource, fallbackForSource, {
        attemptedLiveFetch: getFetcherType(source) !== "fallback_only",
        reason,
      }, startDate, endDate)
    );
  }

  return { reviews, diagnostics };
}

function successReasonForSource(source: ScraperKey): string {
  if (source === "app_store") return "rss_fetch_succeeded";
  if (source === "reddit") {
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) return "reddit_oauth_succeeded";
    if (hasConfiguredWebSearch()) return "reddit_web_search_succeeded";
    return "reddit_public_json_succeeded";
  }
  if (source === "web_news") return "web_search_succeeded";
  if (source === "quora") return "community_search_succeeded";
  if (source === "twitter_web") return "x_api_succeeded";
  return "live_fetch_succeeded";
}

function buildDiagnosticForSource(
  source: ScraperKey,
  liveReviews: Review[],
  fallbackReviews: Review[],
  options: { attemptedLiveFetch: boolean; reason: string },
  startDate?: string,
  endDate?: string
): SourceDiagnostic {
  const liveForSource = liveReviews.filter((review) => normalizeSource(review.source) === source);
  const fallbackForSource = fallbackReviews.filter((review) => normalizeSource(review.source) === source);
  const combined = [...liveForSource, ...fallbackForSource];
  const filtered = filterReviews(combined, { sources: [source], startDate, endDate });
  const invalidDateCount = countInvalidDates(combined);
  const fallbackUsed = fallbackForSource.length > 0;
  const fetcherType = getFetcherType(source);

  return {
    source,
    label: sourceLabel(source),
    attemptedLiveFetch: options.attemptedLiveFetch,
    fetcherType,
    liveRawCount: liveForSource.length,
    fallbackRawCount: fallbackForSource.length,
    combinedRawCount: combined.length,
    beforeDateFilterCount: combined.length,
    afterDateFilterCount: filtered.length,
    afterCleaningCount: filtered.length,
    afterDedupeCount: filtered.length,
    finalCountUsed: filtered.length,
    invalidDateCount,
    removedEmptyCount: 0,
    removedTooShortCount: 0,
    removedLanguageCount: 0,
    removedDuplicateCount: 0,
    removedInvalidDateCount: invalidDateCount,
    fallbackUsed,
    reason: fallbackUsed && options.reason === "live_fetch_succeeded" ? "fallback_used_for_source" : options.reason,
  };
}

function reasonForFetchFailure(source: ScraperKey, reason: unknown): string {
  if (getFetcherType(source) === "fallback_only") return reasonForMissingCredentialSource(source);
  const message = reason instanceof Error ? reason.message : String(reason);
  if ([
    "missing_app_store_app_id",
    "rss_fetch_succeeded",
    "rss_returned_empty",
    "parser_returned_empty",
    "rss_fetch_failed",
    "reddit_oauth_succeeded",
    "reddit_oauth_failed_using_web_search",
    "reddit_auth_missing_using_web_search",
    "reddit_web_search_succeeded",
    "reddit_web_search_no_results",
    "reddit_public_json_succeeded",
    "reddit_auth_missing_public_fetch_used",
    "reddit_auth_missing_or_public_fetch_limited",
    "reddit_auth_missing_public_fetch_limited",
    "reddit_fallback_assisted",
    "missing_web_search_provider",
    "missing_web_search_api_key",
    "web_search_succeeded",
    "community_search_succeeded",
    "x_api_succeeded",
    "x_bearer_token_missing_public_no_auth_unavailable",
  ].includes(message)) return message;
  if (message.includes("timed out")) return "source_timeout";
  if (message.includes("No public reviews")) return "live_fetch_returned_empty";
  if (getFetcherType(source) === "fallback_assisted") return "missing_web_search_provider";
  return getFetcherType(source) === "placeholder" ? "placeholder_fetcher" : "fallback_used_for_source";
}

function hasConfiguredWebSearch(): boolean {
  return Boolean(
    (process.env.WEB_SEARCH_PROVIDER && process.env.WEB_SEARCH_API_KEY) ||
      process.env.BRAVE_SEARCH_API_KEY ||
      process.env.TAVILY_API_KEY ||
      process.env.SERPAPI_API_KEY
  );
}

function reasonForMissingCredentialSource(source: ScraperKey): string {
  if (source === "twitter_web") return "x_bearer_token_missing_public_no_auth_unavailable";
  return "public_no_auth_source_unavailable";
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default router;
