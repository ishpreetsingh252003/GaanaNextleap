/**
 * POST /api/analysis/review-analysis
 * Runs Groq AI analysis on the provided reviews array.
 *
 * Body:
 * {
 *   reviews: Review[]   // cleaned reviews from scraper
 * }
 *
 * Response:
 * {
 *   success: true,
 *   analysis: { summary, themes, sentiment_summary, ... }
 * }
 */
import { Router, Request, Response } from "express";
import groqService from "../services/groqService";
import { Review } from "../types/review";

const router = Router();

/** POST /api/analysis/review-analysis */
router.post("/review-analysis", async (req: Request, res: Response) => {
  const { reviews } = req.body as { reviews?: Review[] };

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

  try {
    console.log(`[AnalysisRoute] Starting Groq analysis on ${reviews.length} reviews...`);
    const analysis = await groqService.analyzeReviews(reviews);

    console.log("[AnalysisRoute] Analysis complete.");
    res.json({
      success: true,
      total_reviews_submitted: reviews.length,
      analysis,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown analysis error";
    console.error("[AnalysisRoute] Error:", msg);

    // Provide a helpful error if the API key is missing
    if (msg.includes("GROQ_API_KEY")) {
      return res.status(503).json({
        error_code: "GROQ_NOT_CONFIGURED",
        error_message: "Groq API key is not configured. Add GROQ_API_KEY to your backend .env file.",
      });
    }

    res.status(500).json({
      error_code: "ANALYSIS_ERROR",
      error_message: "Analysis failed. Check logs for details.",
      error_details: process.env.NODE_ENV === "development" ? msg : null,
    });
  }
});

export default router;
