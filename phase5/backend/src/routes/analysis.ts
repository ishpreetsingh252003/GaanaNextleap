import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { FALLBACK_ANALYSIS } from "../data/fallbackAnalysis";
import { Review } from "../types/review";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;

router.post("/review-analysis", async (req: Request, res: Response) => {
  const { reviews, useFallback } = req.body as {
    reviews?: Review[];
    useFallback?: boolean;
  };

  // ── Explicit fallback request ────────────────────────────────────────────
  if (useFallback === true) {
    console.log("[AnalysisRoute] Returning pre-generated fallback analysis (requested).");
    return res.json({
      success: true,
      total_reviews_submitted: 0,
      analysis: FALLBACK_ANALYSIS,
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
