import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { Review } from "../types/review";
import {
  buildGroqSample,
  buildReliableFallbackAnalysis,
  buildZeroMatchPayload,
  filterReviews,
  getFallbackReviewDataset,
  shapeAnalysisResponse,
} from "../services/analysisService";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;
const GROQ_ANALYSIS_TIMEOUT_MS = 12_000;

// POST /api/analysis/review-analysis
router.post("/review-analysis", async (req: Request, res: Response) => {
  const { reviews, useFallback, sources, startDate, endDate } = req.body as {
    reviews?: Review[];
    useFallback?: boolean;
    sources?: string[];
    startDate?: string;
    endDate?: string;
  };

  const filters = { sources, startDate, endDate };
  const sourceDataset = useFallback ? getFallbackReviewDataset() : reviews ?? [];
  const filteredReviews = filterReviews(sourceDataset, filters);
  const totalReviews = filteredReviews.length;

  if (totalReviews === 0) {
    return res.json(buildZeroMatchPayload(filters));
  }

  if (useFallback === true) {
    const fallbackAnalysis = buildReliableFallbackAnalysis(filteredReviews, filters);
    return res.json(shapeAnalysisResponse(fallbackAnalysis, filteredReviews, filters, true));
  }

  // Full filtered review set is counted for analysis coverage, but only a representative sample is sent to Groq to keep free-tier AI calls lightweight and reliable.
  const groqSample = buildGroqSample(filteredReviews);

  try {
    console.log(
      `[AnalysisRoute] Starting Groq analysis. filtered=${totalReviews}, groqSample=${groqSample.length}`
    );
    const analysis = await withTimeout(
      groqService.analyzeReviews(groqSample),
      GROQ_ANALYSIS_TIMEOUT_MS
    );

    if (!isValidAnalysis(analysis)) {
      throw new Error("AI analysis response was incomplete.");
    }

    return res.json(shapeAnalysisResponse(analysis, filteredReviews, filters, false));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[AnalysisRoute] AI analysis unavailable; returning reliable fallback.", msg);

    const fallbackAnalysis = buildReliableFallbackAnalysis(filteredReviews, filters);
    return res.json(shapeAnalysisResponse(fallbackAnalysis, filteredReviews, filters, true));
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

export default router;
