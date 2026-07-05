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
  filterReviews,
  getFallbackReviewDataset,
  normalizeSource,
  shapeAnalysisResponse,
  validateAnalysisResult,
  VALID_REVIEW_SOURCES,
} from "../services/analysisService";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;
const SOURCE_FETCH_TIMEOUT_MS = 6_000;
const GROQ_STAGE_TIMEOUT_MS = 12_000;

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
  const sourceDataset = await resolveReviewDataset({
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
    return res.json(buildZeroMatchPayload(filters));
  }

  if (useFallback === true) {
    const fallbackAnalysis = buildReliableFallbackAnalysis(filteredReviews, filters);
    const response = shapeAnalysisResponse(fallbackAnalysis, filteredReviews, filters, true);
    response.message = `Showing representative reviews from ${totalReviews} demo feedback entries across all sources.`;
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
}) {
  if (useFallback) return getFallbackReviewDataset();
  if (collectSources || !reviews || reviews.length === 0) {
    return collectReviewsWithSourceFallback(selectedSources as ScraperKey[], startDate, endDate);
  }

  const selected = selectedSources.map(normalizeSource);
  const liveSourceSet = new Set(reviews.map((review) => normalizeSource(review.source)));
  const fallbackForMissingSources = getFallbackReviewDataset().filter((review) => {
    const source = normalizeSource(review.source);
    return selected.includes(source) && !liveSourceSet.has(source);
  });

  return [...reviews, ...fallbackForMissingSources];
}

async function collectReviewsWithSourceFallback(
  selectedSources: ScraperKey[],
  startDate?: string,
  endDate?: string
) {
  const fromDate = startDate ? new Date(startDate) : undefined;
  const toDate = endDate ? new Date(endDate) : undefined;
  const fallbackDataset = getFallbackReviewDataset();

  const settled = await Promise.allSettled(
    selectedSources.map(async (source) => {
      const result = await withTimeout(runScraping([source], fromDate, toDate), SOURCE_FETCH_TIMEOUT_MS);
      if (result.reviews.length === 0) throw new Error("No public reviews returned for source.");
      return result.reviews;
    })
  );

  return settled.flatMap((result, index) => {
    const source = selectedSources[index];
    if (result.status === "fulfilled") return result.value;
    console.warn(`[AnalysisRoute] Source ${source} limited; using reliable review data.`);
    return filterReviews(fallbackDataset, { sources: [source], startDate, endDate });
  });
}

function toDateOnly(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default router;
