import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { FALLBACK_ANALYSIS } from "../data/fallbackAnalysis";
import { fallbackReviews, FallbackReview } from "../data/fallbackData";
import { Review } from "../types/review";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;

// Helper: Filter fallback reviews by source and date range
function filterFallbackReviews(
  sources?: string[],
  startDate?: string,
  endDate?: string
): FallbackReview[] {
  let filtered = fallbackReviews;

  if (sources && sources.length > 0) {
    filtered = filtered.filter((r) => sources.includes(r.source));
  }

  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter((r) => new Date(r.date) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    filtered = filtered.filter((r) => new Date(r.date) <= end);
  }

  return filtered;
}

// POST /api/analysis/review-analysis - NEW unified analysis endpoint
router.post("/review-analysis", async (req: Request, res: Response) => {
  const { reviews, useFallback, sources, startDate, endDate } = req.body as {
    reviews?: Review[];
    useFallback?: boolean;
    sources?: string[];
    startDate?: string;
    endDate?: string;
  };

  // ── Explicit fallback request ────────────────────────────────────────────
  if (useFallback === true) {
    console.log("[AnalysisRoute] Returning pre-generated fallback analysis (requested).");
    const filtered = filterFallbackReviews(sources, startDate, endDate);
    
    // Determine actual date range
    const dates = filtered.map((r) => new Date(r.date).getTime());
    const actualStart = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split("T")[0] : startDate || "2026-01-01";
    const actualEnd = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split("T")[0] : endDate || new Date().toISOString().split("T")[0];

    // Count sources
    const sourcesUsed = Array.from(new Set(filtered.map((r) => r.source)));
    
    return res.json({
      success: true,
      total_reviews_submitted: 0,
      analysis: {
        ...FALLBACK_ANALYSIS,
        total_reviews_analyzed: filtered.length,
        sources_used: sourcesUsed,
        requested_date_range: startDate && endDate ? `${startDate} to ${endDate}` : null,
        actual_date_range: `${actualStart} to ${actualEnd}`,
        is_fallback: true,
      },
    });
  }

  // ── Validate reviews array ───────────────────────────────────────────────
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return res.status(400).json({
      error_code: "NO_REVIEWS",
      error_message: "Please provide a non-empty 'reviews' array in the request body.",
    });
  }

  if (reviews.length < 5) {
    return res.status(400).json({
      error_code: "TOO_FEW_REVIEWS",
      error_message: `At least 5 reviews are needed for meaningful analysis. Got ${reviews.length}.`,
    });
  }

  // ── Try Groq analysis ────────────────────────────────────────────────────
  try {
    console.log(`[AnalysisRoute] Starting Groq analysis on ${reviews.length} reviews...`);
    const analysis = await groqService.analyzeReviews(reviews);

    console.log("[AnalysisRoute] Analysis complete.");
    return res.json({
      success: true,
      total_reviews_submitted: reviews.length,
      analysis: {
        ...analysis,
        is_fallback: false,
      },
    });
  } catch (groqErr) {
    const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
    console.warn("[AnalysisRoute] Groq failed, using fallback analysis:", groqMsg);

    // ── Fallback to pre-generated analysis ──────────────────────────────────
    const isKeyMissing = groqMsg.includes("GROQ_API_KEY");

    if (isKeyMissing) {
      return res.status(503).json({
        error_code: "GROQ_NOT_CONFIGURED",
        error_message:
          "Groq API key is not configured. Add GROQ_API_KEY to your backend .env file. Showing demo fallback analysis.",
        analysis: {
          ...FALLBACK_ANALYSIS,
          is_fallback: true,
          _fallback_reason: "GROQ_API_KEY not configured",
        },
        success: true,
        total_reviews_submitted: reviews.length,
      });
    }

    // For all other Groq errors, return fallback gracefully
    console.log("[AnalysisRoute] Returning fallback analysis due to Groq error.");
    return res.json({
      success: true,
      total_reviews_submitted: reviews.length,
      analysis: {
        ...FALLBACK_ANALYSIS,
        total_reviews_analyzed: reviews.length,
        is_fallback: true,
        _fallback_reason: "AI analysis temporarily unavailable — showing sample analysis for demo reliability.",
      },
    });
  }
});

export default router;
