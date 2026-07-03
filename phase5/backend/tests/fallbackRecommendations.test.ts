import { describe, it, expect } from "vitest";
import { generateFallbackRecommendations } from "../src/data/fallbackRecommendations";

describe("fallbackRecommendations", () => {
  it("returns 8-10 recommendations for valid preferences", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Balanced",
      avoid: [],
    });
    expect(result.recommendations.length).toBeGreaterThanOrEqual(8);
    expect(result.recommendations.length).toBeLessThanOrEqual(10);
  });

  it("every recommendation has required fields", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Balanced",
      avoid: [],
    });
    result.recommendations.forEach((rec) => {
      expect(rec).toHaveProperty("title");
      expect(rec).toHaveProperty("artist_or_type");
      expect(rec).toHaveProperty("language_mood_fit");
      expect(rec).toHaveProperty("why_this_fits");
      expect(rec).toHaveProperty("how_fresh_this_is");
      expect(rec).toHaveProperty("freshness_label");
      expect(rec).toHaveProperty("avoids_repeating");
    });
  });

  it("freshness_label is one of Safe, Balanced, Fresh", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Balanced",
      avoid: [],
    });
    result.recommendations.forEach((rec) => {
      expect(["Safe", "Balanced", "Fresh"]).toContain(rec.freshness_label);
    });
  });

  it("returns explanation and query_used", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Balanced",
      avoid: [],
    });
    expect(result.explanation).toBeDefined();
    expect(result.query_used).toBeDefined();
    expect(result.is_fallback).toBe(true);
  });

  it("respects avoid_mainstream preference", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Fresh",
      avoid: ["avoid_mainstream"],
    });
    result.recommendations.forEach((rec) => {
      expect(rec.avoids_repeating).toContain("not a mainstream viral hit");
    });
  });

  it("includes reference in explanation when provided", () => {
    const result = generateFallbackRecommendations({
      mood: "Chill",
      language: "Hindi",
      activity: "Studying",
      freshness: "Balanced",
      avoid: [],
      reference: "Arijit Singh",
    });
    expect(result.explanation).toContain("Arijit Singh");
  });
});
