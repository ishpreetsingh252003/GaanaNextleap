import { Router, Request, Response } from "express";
import getGroqService, { GroqService } from "../services/groqService";
import { generateFallbackRecommendations } from "../data/fallbackRecommendations";
import { inferDiscoveryIntent } from "../services/discoveryIntent";
import { MusicCatalogTrack, searchMusicCatalog } from "../services/musicCatalogService";

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
const GROQ_CATALOG_TIMEOUT_MS = 8_000;

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
  const uiPreferences = {
    query,
    mood: mood || inferred.mood || "",
    language: language || inferred.language || "",
    activity: activity || inferred.activity || "",
    freshness: freshness || inferred.freshness || "Balanced",
    reference: reference || inferred.reference || query,
    avoid: mergedAvoid,
    queryType: inferred.queryType,
  };
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

  const catalogQuery = query || reference || inferred.reference || "";
  let catalogTracks: MusicCatalogTrack[] = [];
  try {
    catalogTracks = await searchMusicCatalog(catalogQuery, {
      language: preferences.language,
      mood: preferences.mood,
      freshness: preferences.freshness,
      limit: 12,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[DiscoveryRoute] Catalog search unavailable; using fallback recommendations.", msg);
  }

  if (catalogTracks.length > 0) {
    let catalogExplanation: any = null;
    try {
      catalogExplanation = await withTimeout(
        groqService.explainCatalogMatches(catalogTracks, preferences),
        GROQ_CATALOG_TIMEOUT_MS
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[DiscoveryRoute] Catalog explanation unavailable; using simple explanations.", msg);
    }

    const recommendations = buildCatalogRecommendations(
      catalogTracks,
      preferences,
      catalogExplanation?.matches ?? []
    );

    return res.json({
      success: true,
      recommendations,
      explanation:
        catalogExplanation?.explanation ??
        "Matched using public music metadata and shaped into fresh discovery ideas.",
      query_used: catalogQuery,
      matched_using: "public_music_metadata",
      inferred_preferences: inferred,
      resolved_preferences: preferences,
      ui_preferences: uiPreferences,
      is_fallback: false,
    });
  }

  try {
    const fallback = generateFallbackRecommendations(preferences);
    return res.json({
      success: true,
      ...fallback,
      inferred_preferences: inferred,
      resolved_preferences: preferences,
      ui_preferences: uiPreferences,
      is_fallback: true,
      analysisMode: "reliable_demo_analysis",
      message: "Using reliable demo recommendations for this query.",
    });
  } catch (fallbackErr) {
    const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
    console.error("[DiscoveryRoute] Fallback recommendations failed:", fallbackMsg);

    return res.status(500).json({
      error_code: "DISCOVERY_TEMPORARILY_UNAVAILABLE",
      error_message: "Recommendations are temporarily unavailable. Please try again in a moment.",
    });
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

function buildCatalogRecommendations(
  tracks: MusicCatalogTrack[],
  preferences: {
    query?: string;
    mood: string;
    language: string;
    activity: string;
    freshness: string;
    reference?: string;
    avoid: string[];
  },
  explanations: Array<{
    id?: string;
    why_this_fits?: string;
    best_for?: string;
    bestFor?: string;
    freshness_label?: "Safe" | "Balanced" | "Fresh";
  }>
) {
  const explanationById = new Map(explanations.map((item) => [item.id, item]));

  return tracks.slice(0, 10).map((track) => {
    const explanation = explanationById.get(track.id);
    const reference = preferences.reference || preferences.query;
    const why =
      explanation?.why_this_fits ||
      (reference
        ? `Matches "${reference}" as a reference query and gives a familiar starting point for discovery.`
        : "Matches your discovery intent using public music metadata.");
    const bestFor =
      explanation?.best_for ||
      explanation?.bestFor ||
      "Use this as an anchor to explore fresher but still relevant music.";

    return {
      title: track.title,
      artist_or_type: track.artist,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork,
      previewUrl: track.previewUrl,
      externalUrl: track.externalUrl,
      source: "itunes",
      type: "track",
      language_mood_fit: `Matched using public music metadata${preferences.language !== "Mixed" ? ` for ${preferences.language}` : ""}.`,
      why_this_fits: why,
      bestFor,
      best_for: bestFor,
      how_fresh_this_is: preferences.freshness === "Fresh" ? "Public metadata match with a fresher discovery angle." : "Public metadata match for a familiar discovery anchor.",
      freshness_label: explanation?.freshness_label || (preferences.freshness as "Safe" | "Balanced" | "Fresh"),
      avoids_repeating: preferences.avoid.length
        ? "Respects your avoid preferences where public metadata allows."
        : "Use as a reference point; not a claim of full catalog playback.",
    };
  });
}

export default router;
