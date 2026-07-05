import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFallbackReviewDataset } from "../src/services/analysisService";

const runScrapingMock = vi.hoisted(() => vi.fn());
const discoverReviewThemesMock = vi.hoisted(() => vi.fn());
const synthesizeReviewInsightsMock = vi.hoisted(() => vi.fn());

vi.mock("../src/services/scrapeOrchestrator", () => ({
  runScraping: runScrapingMock,
}));

vi.mock("../src/services/groqService", () => ({
  default: () => ({
    discoverReviewThemes: discoverReviewThemesMock,
    synthesizeReviewInsights: synthesizeReviewInsightsMock,
  }),
  GroqService: class {},
}));

import analysisRoutes from "../src/routes/analysis";

describe("analysis route reliable review workflow", () => {
  beforeEach(() => {
    runScrapingMock.mockReset();
    discoverReviewThemesMock.mockReset();
    synthesizeReviewInsightsMock.mockReset();
    discoverReviewThemesMock.mockResolvedValue({
      themes: [{ label: "Repeat listening", description: "Same songs repeat", supportingReviewIds: ["gp-1"] }],
      painPoints: ["Users cannot find fresh alternatives"],
      segmentInsights: [],
      unmetNeeds: [],
    });
    synthesizeReviewInsightsMock.mockResolvedValue(validGroqAnalysis());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Run Full Demo Analysis ignores narrow filters and returns 100+ demo entries", async () => {
    const response = await postAnalysis({
      useFallback: true,
      sources: ["google_play"],
      startDate: "2026-07-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(response.body.totalReviews).toBeGreaterThanOrEqual(100);
    expect(response.body.sourcesUsed.length).toBe(6);
    expect(response.body.analysis.analysisMode).toBe("demo");
    expect(response.body.sourceDiagnostics).toHaveLength(6);
    expect(response.body.sourceDiagnostics.every((diag: any) => diag.finalCountUsed > 0)).toBe(true);
  });

  it("selected source collection failure still returns fallback-assisted analysis", async () => {
    runScrapingMock.mockRejectedValue(new Error("source blocked"));

    const response = await postAnalysis({
      collectSources: true,
      sources: ["google_play"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalReviews).toBe(20);
    expect(response.body.message).toContain("reliable review data");
    expect(response.body.sourceDiagnostics[0]).toMatchObject({
      source: "google_play",
      liveRawCount: 0,
      fallbackUsed: true,
      fallbackRawCount: 20,
      finalCountUsed: 20,
    });
  });

  it("returns a friendly zero state when no feedback matches", async () => {
    runScrapingMock.mockRejectedValue(new Error("source blocked"));

    const response = await postAnalysis({
      collectSources: true,
      sources: ["google_play"],
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(response.status).toBe(200);
    expect(response.body.totalReviews).toBe(0);
    expect(response.body.representativeReviews).toEqual([]);
    expect(response.body.message).toContain("No feedback entries matched");
    expect(response.body.sourceDiagnostics[0]).toMatchObject({
      source: "google_play",
      finalCountUsed: 0,
    });
  });

  it("Groq failure after retries returns deterministic reliable analysis without technical errors", async () => {
    synthesizeReviewInsightsMock.mockRejectedValue(new Error("Groq rate limit"));

    const response = await postAnalysis({
      reviews: getFallbackReviewDataset(),
      sources: ["google_play", "app_store"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(response.body.analysis.analysisMode).toBe("reliable_analysis");
    expect(response.body.message).not.toMatch(/Groq|rate limit|timeout|API/i);
    expect(response.body.representativeReviews.length).toBeLessThanOrEqual(8);
  });

  it("large review sets are sent to Groq as capped chunks instead of one raw corpus", async () => {
    const response = await postAnalysis({
      reviews: getFallbackReviewDataset(),
      sources: ["google_play", "app_store", "reddit", "quora", "web_news", "twitter_web"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(discoverReviewThemesMock).toHaveBeenCalledTimes(2);
    const chunkSizes = discoverReviewThemesMock.mock.calls.map((call) => call[0].length);
    expect(Math.max(...chunkSizes)).toBeLessThanOrEqual(50);
    expect(chunkSizes.reduce((sum, size) => sum + size, 0)).toBeLessThan(getFallbackReviewDataset().length);
  });

  it("Stage B validation failure triggers a repair pass", async () => {
    synthesizeReviewInsightsMock
      .mockResolvedValueOnce({ themes: [], problem_statement: "", business_opportunity: "" })
      .mockResolvedValueOnce(validGroqAnalysis());

    const response = await postAnalysis({
      reviews: getFallbackReviewDataset().slice(0, 30),
      sources: ["google_play", "app_store"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(synthesizeReviewInsightsMock).toHaveBeenCalledTimes(2);
  });

  it("fallback-only fetchers are reported honestly in diagnostics", async () => {
    const response = await postAnalysis({
      collectSources: true,
      sources: ["twitter_web"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    expect(response.status).toBe(200);
    expect(response.body.sourceDiagnostics[0]).toMatchObject({
      source: "twitter_web",
      attemptedLiveFetch: false,
      fetcherType: "fallback_only",
      reason: "public_no_auth_source_unavailable",
    });
  });

  it("sourceDiagnostics final counts sum to totalReviews for source fallback runs", async () => {
    runScrapingMock.mockRejectedValue(new Error("source blocked"));

    const response = await postAnalysis({
      collectSources: true,
      sources: ["google_play", "app_store"],
      startDate: "2026-01-01",
      endDate: "2026-07-05",
    });

    const diagnosticTotal = response.body.sourceDiagnostics.reduce(
      (sum: number, diag: any) => sum + diag.finalCountUsed,
      0
    );
    expect(response.body.totalReviews).toBe(diagnosticTotal);
  });
});

function validGroqAnalysis() {
  return {
    summary: "Users struggle with repeat listening and want fresher discovery controls.",
    total_reviews_analyzed: 40,
    themes: [{
      theme_name: "Repetitive recommendations",
      count: 20,
      description: "Users see the same songs too often.",
      pain_point: "Discovery feels stale.",
      representative_quotes: ["The same songs keep coming in my recommendations even when I skip them."],
      opportunity: "Add freshness and avoid controls.",
    }],
    sentiment_summary: { positive: 10, neutral: 30, negative: 60 },
    target_user_segment: "Indian music listeners looking for fresh but relevant discovery.",
    problem_statement: "Users return to old playlists because discovery feels repetitive.",
    business_opportunity: "Give listeners more control over freshness, mood, and regional discovery.",
    quotes: ["The same songs keep coming in my recommendations even when I skip them."],
    representativeReviews: getFallbackReviewDataset().slice(0, 8),
  };
}

async function postAnalysis(body: Record<string, unknown>) {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use("/api/analysis", analysisRoutes);

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/analysis/review-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await closeServer(server);
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
