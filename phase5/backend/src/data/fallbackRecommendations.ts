/**
 * Fallback Recommendations Generator
 *
 * Used when Groq API is unavailable to generate demo-ready recommendations
 * from the sample catalog. Returns structured data in the same shape as
 * Groq's generateRecommendations() output.
 *
 * DISCLAIMER: Uses sample public music metadata for demonstration only.
 * Does not represent Gaana's full internal catalog.
 */

import { filterCatalog, CatalogTrack } from "./sampleCatalog";

interface RecommendationCard {
  title: string;
  artist_or_type: string;
  language_mood_fit: string;
  why_this_fits: string;
  how_fresh_this_is: string;
  freshness_label: "Safe" | "Balanced" | "Fresh";
  avoids_repeating: string;
}

interface FallbackRecommendationResult {
  recommendations: RecommendationCard[];
  explanation: string;
  query_used: string;
  is_fallback: boolean;
}

function toFreshnessLabel(level: CatalogTrack["freshness_level"]): "Safe" | "Balanced" | "Fresh" {
  if (level === "safe") return "Safe";
  if (level === "balanced") return "Balanced";
  return "Fresh";
}

function buildWhyFits(
  track: CatalogTrack,
  mood: string,
  activity: string,
  reference?: string
): string {
  const reasons: string[] = [];

  if (track.moods.some((m) => m.toLowerCase() === mood.toLowerCase())) {
    reasons.push(`matches your ${mood.toLowerCase()} mood`);
  }
  if (track.activities.some((a) => a.toLowerCase() === activity.toLowerCase())) {
    reasons.push(`suited for ${activity.toLowerCase()}`);
  }
  if (reference && track.tags.some((t) => t.toLowerCase().includes(reference.toLowerCase().split(" ")[0]))) {
    reasons.push(`similar vibe to ${reference}`);
  }
  if (track.popularity_level === "underrated") {
    reasons.push("underrated track worth discovering");
  }
  if (track.tags.includes("folk") || track.tags.includes("regional")) {
    reasons.push("brings authentic regional flavour");
  }

  return reasons.length > 0
    ? `This ${track.language} track ${reasons.join(", ")}.`
    : `A strong ${track.language} pick for your current vibe.`;
}

function buildAvoids(track: CatalogTrack, avoid: string[]): string {
  const parts: string[] = [];

  if (avoid.includes("avoid_repeated_artists")) {
    parts.push("different artist from your reference");
  }
  if (avoid.includes("avoid_mainstream") && track.popularity_level !== "mainstream") {
    parts.push("not a mainstream viral hit");
  }
  if (avoid.includes("avoid_overplayed") && track.freshness_level !== "safe") {
    parts.push("avoids overplayed charts");
  }
  if (track.popularity_level === "underrated") {
    parts.push("gem from outside the popular playlist loop");
  }

  return parts.length > 0 ? parts.join("; ") : "distinct from typical recommendation loops";
}

function buildFreshnessDescription(track: CatalogTrack): string {
  if (track.freshness_level === "fresh") {
    return track.popularity_level === "underrated"
      ? "Underrated / emerging — worth discovering"
      : "Newer release — outside the mainstream rotation";
  }
  if (track.freshness_level === "balanced") {
    return "Known but not overplayed — solid discovery pick";
  }
  return "Popular hit — familiar and well-loved";
}

/**
 * Generate fallback recommendations from sample catalog.
 * Returns 8–10 cards matching preferences.
 */
export function generateFallbackRecommendations(preferences: {
  mood: string;
  language: string;
  activity: string;
  freshness: string;
  reference?: string;
  avoid: string[];
}): FallbackRecommendationResult {
  const { mood, language, activity, freshness, reference, avoid } = preferences;

  let matches = filterCatalog({ language, mood, activity, freshness, avoid });

  // If we got < 8, relax language filter to Mixed
  if (matches.length < 8) {
    const relaxed = filterCatalog({
      language: "Mixed",
      mood,
      activity,
      freshness,
      avoid,
    });
    // Add relaxed results not already in matches
    const seen = new Set(matches.map((t) => t.title));
    for (const t of relaxed) {
      if (!seen.has(t.title)) {
        matches.push(t);
        seen.add(t.title);
      }
    }
  }

  // Shuffle for variety, then take 8-10
  const shuffled = matches.sort(() => Math.random() - 0.5).slice(0, 10);
  const count = Math.max(8, shuffled.length);
  const final = shuffled.slice(0, count);

  const recommendations: RecommendationCard[] = final.map((track) => ({
    title: track.title,
    artist_or_type: track.artist,
    language_mood_fit: `${track.language} track — fits ${mood} mood and ${activity} context.`,
    why_this_fits: buildWhyFits(track, mood, activity, reference),
    how_fresh_this_is: buildFreshnessDescription(track),
    freshness_label: toFreshnessLabel(track.freshness_level),
    avoids_repeating: buildAvoids(track, avoid),
  }));

  const explanation =
    `Showing ${recommendations.length} ${language} recommendations for ${mood} mood during ${activity}. ` +
    `Freshness: ${freshness}. ` +
    (reference ? `Style inspired by: ${reference}. ` : "") +
    `Note: Generated from sample public music metadata for demo reliability. Does not represent Gaana's full catalog.`;

  const query_used = `${mood} ${language} songs for ${activity}${reference ? ` like ${reference}` : ""}${avoid.length ? ` (avoiding: ${avoid.join(", ")})` : ""}`;

  return {
    recommendations,
    explanation,
    query_used,
    is_fallback: true,
  };
}
