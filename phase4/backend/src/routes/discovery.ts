/**
 * POST /api/discovery-agent
 * Generates AI-powered music recommendations based on user preferences.
 *
 * Body:
 * {
 *   mood: "Chill" | "Sad" | "Party" | "Gym" | "Travel" | "Focus" | "Romantic" | "Energetic",
 *   language: "Hindi" | "Punjabi" | "Tamil" | "Telugu" | "Bhojpuri" | "English" | "Mixed",
 *   activity: "Studying" | "Travelling" | "Gym" | "Late night" | "Party" | "Work" | "Relaxing",
 *   freshness: "Safe" | "Balanced" | "Fresh",
 *   reference?: string,
 *   avoid: string[]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   recommendations: [...],
 *   explanation: "...",
 *   query_used: "..."
 * }
 */
import { Router, Request, Response } from "express";
import getGroqService from "../services/groqService";

const router = Router();

const VALID_MOODS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const VALID_LANGUAGES = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const VALID_ACTIVITIES = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const VALID_FRESHNESS = ["Safe", "Balanced", "Fresh"];
const VALID_AVOID_OPTIONS = [
  "avoid_repeated_artists",
  "avoid_mainstream",
  "avoid_overplayed",
  "avoid_sad",
  "avoid_slow"
];

/** POST /api/discovery-agent */
router.post("/discovery-agent", async (req: Request, res: Response) => {
  const { mood, language, activity, freshness, reference, avoid } = req.body;

  // Validate required fields
  if (!mood || !language || !activity || !freshness) {
    return res.status(400).json({
      error_code: "MISSING_REQUIRED_FIELDS",
      error_message: "Missing required fields: mood, language, activity, freshness",
    });
  }

  // Validate enum values
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

  // Validate avoid array
  if (avoid && !Array.isArray(avoid)) {
    return res.status(400).json({
      error_code: "INVALID_AVOID_FORMAT",
      error_message: "Avoid must be an array of strings",
    });
  }

  if (avoid) {
    const invalidAvoid = avoid.filter((a: string) => !VALID_AVOID_OPTIONS.includes(a));
    if (invalidAvoid.length > 0) {
      return res.status(400).json({
        error_code: "INVALID_AVOID_OPTIONS",
        error_message: `Invalid avoid options: ${invalidAvoid.join(", ")}`,
      });
    }
  }

  try {
    console.log(`[DiscoveryRoute] Generating recommendations for mood=${mood}, language=${language}, activity=${activity}`);
    
    const groqService = getGroqService();
    const result = await groqService.generateRecommendations({
      mood,
      language,
      activity,
      freshness,
      reference: reference || undefined,
      avoid: avoid || [],
    });

    console.log("[DiscoveryRoute] Recommendations generated successfully");
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown discovery error";
    console.error("[DiscoveryRoute] Error:", msg);

    // Provide a helpful error if the API key is missing
    if (msg.includes("GROQ_API_KEY")) {
      return res.status(503).json({
        error_code: "GROQ_NOT_CONFIGURED",
        error_message: "Groq API key is not configured. Add GROQ_API_KEY to your backend .env file.",
      });
    }

    res.status(500).json({
      error_code: "DISCOVERY_ERROR",
      error_message: "Failed to generate recommendations. Please try again.",
      error_details: process.env.NODE_ENV === "development" ? msg : null,
    });
  }
});

export default router;
