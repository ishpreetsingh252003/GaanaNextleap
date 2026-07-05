import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { generateFallbackRecommendations } from "../data/fallbackRecommendations";

const router = Router();
const groqService = getGroqService() as unknown as GroqService;

const VALID_MOODS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const VALID_LANGUAGES = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const VALID_ACTIVITIES = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const VALID_FRESHNESS = ["Safe", "Balanced", "Fresh"];
const VALID_AVOID_OPTIONS = [
  "avoid_repeated_artists",
  "avoid_mainstream",
  "avoid_overplayed",
  "avoid_sad",
  "avoid_slow",
];
const GROQ_DISCOVERY_TIMEOUT_MS = 12_000;

router.post("/discovery-agent", async (req: Request, res: Response) => {
  const { mood, language, activity, freshness, reference, avoid, refineAction } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!mood || !language || !activity || !freshness) {
    return res.status(400).json({
      error_code: "MISSING_REQUIRED_FIELDS",
      error_message: "Missing required fields: mood, language, activity, freshness",
    });
  }
  if (!VALID_MOODS.includes(mood)) {
    return res.status(400).json({
      error_code: "INVALID_MOOD",
      error_message: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}`,
    });
  }
  if (!VALID_LANGUAGES.includes(language)) {
    return res.status(400).json({
      error_code: "INVALID_LANGUAGE",
      error_message: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(", ")}`,
    });
  }
  if (!VALID_ACTIVITIES.includes(activity)) {
    return res.status(400).json({
      error_code: "INVALID_ACTIVITY",
      error_message: `Invalid activity. Must be one of: ${VALID_ACTIVITIES.join(", ")}`,
    });
  }
  if (!VALID_FRESHNESS.includes(freshness)) {
    return res.status(400).json({
      error_code: "INVALID_FRESHNESS",
      error_message: `Invalid freshness. Must be one of: ${VALID_FRESHNESS.join(", ")}`,
    });
  }
  if (avoid && !Array.isArray(avoid)) {
    return res.status(400).json({
      error_code: "INVALID_AVOID_FORMAT",
      error_message: "Avoid must be an array of strings",
    });
  }
  if (avoid) {
    const invalidAvoid = (avoid as string[]).filter((a) => !VALID_AVOID_OPTIONS.includes(a));
    if (invalidAvoid.length > 0) {
      return res.status(400).json({
        error_code: "INVALID_AVOID_OPTIONS",
        error_message: `Invalid avoid options: ${invalidAvoid.join(", ")}. Valid: ${VALID_AVOID_OPTIONS.join(", ")}`,
      });
    }
  }

  const preferences = {
    mood: mood as string,
    language: language as string,
    activity: activity as string,
    freshness: freshness as string,
    reference: reference as string | undefined,
    avoid: (avoid as string[]) || [],
    refineAction: refineAction as string | undefined,
  };

  // ── Try Groq first ───────────────────────────────────────────────────────
  try {
    console.log(
      `[DiscoveryRoute] Generating recommendations — mood=${mood}, language=${language}, activity=${activity}, freshness=${freshness}`
    );

    const result = await withTimeout(
      groqService.generateRecommendations(preferences),
      GROQ_DISCOVERY_TIMEOUT_MS
    );

    console.log("[DiscoveryRoute] Groq recommendations generated successfully");
    return res.json({
      success: true,
      is_fallback: false,
      ...result,
    });
  } catch (groqErr) {
    const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
    console.warn("[DiscoveryRoute] Groq failed, using sample catalog fallback:", groqMsg);

    // ── Fallback to sample catalog ─────────────────────────────────────────
    try {
      const fallback = generateFallbackRecommendations(preferences);
      console.log(`[DiscoveryRoute] Fallback returned ${fallback.recommendations.length} recommendations`);

      return res.json({
        success: true,
        ...fallback,
        is_fallback: true,
        analysisMode: "reliable_demo_analysis",
      });
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error("[DiscoveryRoute] Both Groq and fallback failed:", fallbackMsg);

      return res.status(500).json({
        error_code: "DISCOVERY_TEMPORARILY_UNAVAILABLE",
        error_message: "Recommendations are temporarily unavailable. Please try again in a moment.",
      });
    }
  }
});

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("AI generation timed out.")), timeoutMs);
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

export default router;
