import { describe, expect, it } from "vitest";
import {
  buildGroqSample,
  buildReliableFallbackAnalysis,
  buildZeroMatchPayload,
  filterReviews,
  getFallbackReviewDataset,
  selectRepresentativeReviews,
} from "../src/services/analysisService";

describe("analysisService", () => {
  const dataset = getFallbackReviewDataset();

  it("totalReviews changes when source filter changes", () => {
    const all = filterReviews(dataset, {
      sources: ["google_play", "app_store", "reddit", "quora", "web_news", "twitter_web"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });
    const googlePlayOnly = filterReviews(dataset, {
      sources: ["google_play"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(all.length).toBeGreaterThan(googlePlayOnly.length);
    expect(googlePlayOnly.every((review) => review.source === "google_play")).toBe(true);
  });

  it("totalReviews changes when date range changes", () => {
    const fullRange = filterReviews(dataset, {
      sources: ["google_play"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });
    const narrowRange = filterReviews(dataset, {
      sources: ["google_play"],
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });

    expect(fullRange.length).toBeGreaterThan(narrowRange.length);
    expect(narrowRange.every((review) => review.date >= "2026-01-01" && review.date <= "2026-01-31")).toBe(true);
  });

  it("representativeReviews length is capped at 8", () => {
    const representative = selectRepresentativeReviews(dataset);
    expect(representative.length).toBeLessThanOrEqual(8);
  });

  it("Groq sample helper caps reviews at 30", () => {
    const sample = buildGroqSample(dataset);
    expect(sample.length).toBeLessThanOrEqual(30);
  });

  it("zero matching reviews returns friendly response", () => {
    const response = buildZeroMatchPayload({
      sources: ["google_play"],
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(response.totalReviews).toBe(0);
    expect(response.representativeReviews).toEqual([]);
    expect(response.analysis.themes).toEqual([]);
    expect(response.message).toContain("No feedback entries matched");
  });

  it("fallback analysis respects source and date filters", () => {
    const filtered = filterReviews(dataset, {
      sources: ["reddit"],
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
    const analysis = buildReliableFallbackAnalysis(filtered, {
      sources: ["reddit"],
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });

    expect(analysis.total_reviews_analyzed).toBe(filtered.length);
    expect(analysis.sourcesUsed).toEqual(["reddit"]);
    expect(analysis.representativeReviews.every((review) => review.source === "reddit")).toBe(true);
  });
});
