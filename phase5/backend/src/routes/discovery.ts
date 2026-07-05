import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { generateFallbackRecommendations } from "../data/fallbackRecommendations";
import { inferDiscoveryIntent } from "../services/discoveryIntent";

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
  const { query, mood, language, activity, freshness, reference, avoid, refineAction } = req.body as {
    query?: string;
    mood?: string;
    language?: string;
    activity?: string;
    freshness?: string;
    reference?: string;
    avoid?: string[];
    refineAction?: string;
  };

  const inferred = inferDiscoveryIntent(query || reference || "");
  const mergedAvoid = Array.from(new Set([...(inferred.avoid ?? []), ...(avoid ?? [])]));
  const preferences = {
    query,
    mood: mood || inferred.mood || "Chill",
    language: language || inferred.language || "Mixed",
    activity: activity || inferred.activity || "Relaxing",
    freshness: freshness || inferred.freshness || "Balanced",
    reference: reference || inferred.reference || query,
    avoid: mergedAvoid,
    refineAction,
  };

  if (!VALID_MOODS.includes(preferences.mood)) {
    return res.status(400).json({
      error_code: "INVALID_MOOD",
      error_message: `Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}`,
    });
  }
  if (!VALID_LANGUAGES.includes(preferences.language)) {
    return res.status(400).json({
      error_code: "INVALID_LANGUAGE",
      error_message: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(", ")}`,
    });
  }
  if (!VALID_ACTIVITIES.includes(preferences.activity)) {
    return res.status(400).json({
      error_code: "INVALID_ACTIVITY",
      error_message: `Invalid activity. Must be one of: ${VALID_ACTIVITIES.join(", ")}`,
    });
  }
  if (!VALID_FRESHNESS.includes(preferences.freshness)) {
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
  const invalidAvoid = mergedAvoid.filter((a) => !VALID_AVOID_OPTIONS.includes(a));
  if (invalidAvoid.length > 0) {
    return res.status(400).json({
      error_code: "INVALID_AVOID_OPTIONS",
      error_message: `Invalid avoid options: ${invalidAvoid.join(", ")}. Valid: ${VALID_AVOID_OPTIONS.join(", ")}`,
    });
  }

  try {
    console.log(
      `[DiscoveryRoute] Generating recommendations - query=${query || ""}, mood=${preferences.mood}, language=${preferences.language}, activity=${preferences.activity}, freshness=${preferences.freshness}`
    );

    const result = await withTimeout(
      groqService.generateRecommendations(preferences),
      GROQ_DISCOVERY_TIMEOUT_MS
    );

    return res.json({
      success: true,
      is_fallback: false,
      inferred_preferences: inferred,
      resolved_preferences: preferences,
      ...result,
    });
  } catch (groqErr) {
    const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr);
    console.warn("[DiscoveryRoute] AI generation unavailable; using fallback recommendations.", groqMsg);

    try {
      const fallback = generateFallbackRecommendations(preferences);
      return res.json({
        success: true,
        ...fallback,
        inferred_preferences: inferred,
        resolved_preferences: preferences,
        is_fallback: true,
        analysisMode: "reliable_demo_analysis",
      });
    } catch (fallbackErr) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error("[DiscoveryRoute] Both AI and fallback recommendations failed:", fallbackMsg);

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
