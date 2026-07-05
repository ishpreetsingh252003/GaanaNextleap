import { describe, expect, it } from "vitest";
import {
  buildGroqSample,
  buildGroqChunks,
  buildStratifiedReviewSample,
  buildReliableFallbackAnalysis,
  buildZeroMatchPayload,
  containsPII,
  countInvalidDates,
  filterReviews,
  getFallbackReviewDataset,
  normalizeSource,
  selectRepresentativeReviews,
  validateAnalysisResult,
} from "../src/services/analysisService";
import { normalizeReviewDate } from "../src/utils/dateFilter";

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

  it("source IDs normalize to canonical values without dropping valid sources", () => {
    expect(normalizeSource("Google Play")).toBe("google_play");
    expect(normalizeSource("twitter_x")).toBe("twitter_web");
    expect(normalizeSource("web")).toBe("web_news");
  });

  it("date filtering includes boundary dates and avoids timezone day shifts", () => {
    const boundaryReviews = [
      { ...dataset[0], id: "boundary-start", date: "2026-01-01" },
      { ...dataset[1], id: "boundary-end", date: "2026-07-06T23:30:00+05:30" },
    ];

    const filtered = filterReviews(boundaryReviews, {
      sources: ["google_play"],
      startDate: "2026-01-01",
      endDate: "2026-07-06",
    });

    expect(filtered.map((review) => review.id)).toContain("boundary-start");
    expect(filtered.map((review) => review.id)).toContain("boundary-end");
    expect(normalizeReviewDate("2026-01-01")).toBe("2026-01-01");
  });

  it("invalid dates can be counted for diagnostics", () => {
    expect(countInvalidDates([{ ...dataset[0], date: "not-a-date" }])).toBe(1);
  });

  it("representativeReviews length is capped at 8", () => {
    const representative = selectRepresentativeReviews(dataset);
    expect(representative.length).toBeLessThanOrEqual(8);
  });

  it("Groq sample helper caps reviews at staged sample limit", () => {
    const sample = buildGroqSample(dataset);
    expect(sample.length).toBeLessThanOrEqual(90);
  });

  it("large review sets use stratified sampling and chunking", () => {
    const sample = buildStratifiedReviewSample(dataset, 90);
    const chunks = buildGroqChunks(sample, 50);

    expect(sample.length).toBeLessThanOrEqual(90);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 50)).toBe(true);
    expect(new Set(sample.map((review) => review.source)).size).toBeGreaterThan(1);
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

  it("validation caps representative reviews and strips obvious PII quotes", () => {
    const filtered = dataset.slice(0, 12);
    const analysis = {
      themes: [{
        theme_name: "Repetition",
        pain_point: "Same songs repeat",
        representative_quotes: [filtered[0].text, "email me at user@example.com"],
      }],
      sentiment_summary: { positive: 0, neutral: 20, negative: 80 },
      problem_statement: "Users struggle to find fresh music.",
      business_opportunity: "Use better discovery controls.",
      representativeReviews: filtered,
      quotes: [filtered[0].text, "@listener wants support"],
    };

    expect(validateAnalysisResult(analysis, filtered)).toBe(true);
    expect(analysis.representativeReviews.length).toBeLessThanOrEqual(8);
    expect(analysis.quotes.every((quote: string) => !containsPII(quote))).toBe(true);
  });
});
