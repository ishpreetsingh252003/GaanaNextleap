import { describe, it, expect } from "vitest";
import { FALLBACK_ANALYSIS } from "../src/data/fallbackAnalysis";

describe("fallbackAnalysis", () => {
  it("contains required analysis fields", () => {
    expect(FALLBACK_ANALYSIS).toHaveProperty("summary");
    expect(FALLBACK_ANALYSIS).toHaveProperty("total_reviews_analyzed");
    expect(FALLBACK_ANALYSIS).toHaveProperty("themes");
    expect(FALLBACK_ANALYSIS).toHaveProperty("sentiment_summary");
    expect(FALLBACK_ANALYSIS).toHaveProperty("target_user_segment");
    expect(FALLBACK_ANALYSIS).toHaveProperty("problem_statement");
    expect(FALLBACK_ANALYSIS).toHaveProperty("business_opportunity");
  });

  it("themes array has 3-5 themes", () => {
    expect(FALLBACK_ANALYSIS.themes.length).toBeGreaterThanOrEqual(3);
    expect(FALLBACK_ANALYSIS.themes.length).toBeLessThanOrEqual(5);
  });

  it("each theme has required fields", () => {
    FALLBACK_ANALYSIS.themes.forEach((theme) => {
      expect(theme).toHaveProperty("theme_name");
      expect(theme).toHaveProperty("count");
      expect(theme).toHaveProperty("description");
      expect(theme).toHaveProperty("pain_point");
      expect(theme).toHaveProperty("representative_quotes");
      expect(theme).toHaveProperty("opportunity");
    });
  });

  it("each theme has at least 2 representative quotes", () => {
    FALLBACK_ANALYSIS.themes.forEach((theme) => {
      expect(theme.representative_quotes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("sentiment_summary values sum to 100", () => {
    const { positive, neutral, negative } = FALLBACK_ANALYSIS.sentiment_summary;
    expect(positive + neutral + negative).toBe(100);
  });

  it("is_fallback flag is true", () => {
    expect(FALLBACK_ANALYSIS.is_fallback).toBe(true);
  });

  it("summary is non-empty string", () => {
    expect(typeof FALLBACK_ANALYSIS.summary).toBe("string");
    expect(FALLBACK_ANALYSIS.summary.length).toBeGreaterThan(0);
  });

  it("problem_statement is non-empty string", () => {
    expect(typeof FALLBACK_ANALYSIS.problem_statement).toBe("string");
    expect(FALLBACK_ANALYSIS.problem_statement.length).toBeGreaterThan(0);
  });

  it("business_opportunity is non-empty string", () => {
    expect(typeof FALLBACK_ANALYSIS.business_opportunity).toBe("string");
    expect(FALLBACK_ANALYSIS.business_opportunity.length).toBeGreaterThan(0);
  });
});
