import { Router, Request, Response, NextFunction } from "express";
import { runScraping, ScraperKey } from "../services/scrapeOrchestrator";
import { ReviewSource } from "../types/review";

const router = Router();

const VALID_SOURCES: ReviewSource[] = [
  "google_play",
  "app_store",
  "reddit",
  "quora",
  "web_news",
  "twitter_web",
];

router.get("/sources", (_req: Request, res: Response) => {
  res.json({
    sources: VALID_SOURCES.map((s) => ({
      id: s,
      label: sourceLabel(s),
      description: sourceDescription(s),
    })),
  });
});

router.post("/scrape", async (req: Request, res: Response) => {
  const { sources, fromDate, toDate } = req.body as {
    sources?: string[];
    fromDate?: string;
    toDate?: string;
  };

  let selectedSources: ScraperKey[];
  if (sources && Array.isArray(sources) && sources.length > 0) {
    const invalid = sources.filter((s) => !VALID_SOURCES.includes(s as ReviewSource));
    if (invalid.length > 0) {
      return res.status(400).json({
        error_code: "INVALID_SOURCES",
        error_message: `Unknown sources: ${invalid.join(", ")}. Valid: ${VALID_SOURCES.join(", ")}`,
      });
    }
    selectedSources = sources as ScraperKey[];
  } else {
    selectedSources = [...VALID_SOURCES];
  }

  let fromDateObj: Date | undefined;
  let toDateObj: Date | undefined;
  if (fromDate) {
    fromDateObj = new Date(fromDate);
    if (isNaN(fromDateObj.getTime())) {
      return res.status(400).json({
        error_code: "INVALID_FROM_DATE",
        error_message: `Invalid fromDate format: ${fromDate}. Use YYYY-MM-DD or ISO 8601 string.`,
      });
    }
  }
  if (toDate) {
    toDateObj = new Date(toDate);
    if (isNaN(toDateObj.getTime())) {
      return res.status(400).json({
        error_code: "INVALID_TO_DATE",
        error_message: `Invalid toDate format: ${toDate}. Use YYYY-MM-DD or ISO 8601 string.`,
      });
    }
  }

  try {
    console.log(`[Route] Scraping sources: ${selectedSources.join(", ")}`);
    const result = await runScraping(selectedSources, fromDateObj, toDateObj);

    res.json({
      success: true,
      total_reviews: result.total,
      date_range: result.date_range,
      sources_summary: result.sources,
      errors: result.errors.length > 0 ? result.errors : undefined,
      reviews: result.reviews,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown scraping error";
    console.error("[Route] Scrape error:", msg);
    res.status(500).json({
      error_code: "SCRAPE_ERROR",
      error_message: "Scraping failed. Check logs for details.",
      error_details: process.env.NODE_ENV === "development" ? msg : null,
    });
  }
});

function sourceLabel(s: ReviewSource): string {
  const labels: Record<ReviewSource, string> = {
    google_play: "Google Play Store",
    app_store: "Apple App Store",
    reddit: "Reddit",
    quora: "Quora",
    web_news: "Web / News",
    twitter_web: "Twitter / X",
  };
  return labels[s];
}

function sourceDescription(s: ReviewSource): string {
  const desc: Record<ReviewSource, string> = {
    google_play: "Android user reviews from Google Play Store (Jan 2026–now)",
    app_store: "iOS user reviews from Apple App Store India (Jan 2026–now)",
    reddit: "Posts and discussions from relevant subreddits (Jan 2026–now)",
    quora: "Quora answers and opinions via search (Jan 2026–now)",
    web_news: "Tech blogs, forums, and news articles (Jan 2026–now)",
    twitter_web: "Public tweets via Nitter mirror (Jan 2026–now)",
  };
  return desc[s];
}

export default router;
