import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import getGroqService, { GroqService } from "../src/services/groqService";

const mockCreate = vi.fn();

vi.mock("groq-sdk", () => {
  return {
    default: class MockedGroq {
      constructor(_config: any) {}
      chat = { completions: { create: mockCreate } };
    },
  };
});

describe("GroqService", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    process.env.GROQ_API_KEY = "sk-test-valid-key";
    vi.clearAllMocks();
    mockCreate.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("initialization", () => {
    it("initializes client when GROQ_API_KEY is provided", async () => {
      const { GroqService } = await import("../src/services/groqService");
      const service = new GroqService();
      expect(() => (service as any).getClient()).not.toThrow();
    });

    it("does not initialize client when GROQ_API_KEY is empty", async () => {
      process.env.GROQ_API_KEY = "";
      vi.resetModules();
      const { GroqService } = await import("../src/services/groqService");
      const service = new GroqService();
      expect(() => (service as any).getClient()).toThrow("GROQ_API_KEY is missing");
    });

    it("does not initialize client when GROQ_API_KEY is placeholder", async () => {
      process.env.GROQ_API_KEY = "your_groq_api_key_here";
      vi.resetModules();
      const { GroqService } = await import("../src/services/groqService");
      const service = new GroqService();
      expect(() => (service as any).getClient()).toThrow("GROQ_API_KEY is missing");
    });

    it("getClient() throws when API key is missing", async () => {
      process.env.GROQ_API_KEY = "";
      vi.resetModules();
      const { GroqService } = await import("../src/services/groqService");
      const service = new GroqService();
      expect(() => (service as any).getClient()).toThrow("GROQ_API_KEY is missing");
    });

    it("getClient() throws when API key is placeholder", async () => {
      process.env.GROQ_API_KEY = "your_groq_api_key_here";
      vi.resetModules();
      const { GroqService } = await import("../src/services/groqService");
      const service = new GroqService();
      expect(() => (service as any).getClient()).toThrow("GROQ_API_KEY is missing");
    });
  });

  describe("analyzeReviews", () => {
    it("throws when reviews array is empty", async () => {
      const service = new GroqService();
      await expect(service.analyzeReviews([])).rejects.toThrow("No reviews provided");
    });

    it("limits analysis prompt to first 30 reviews", async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              summary: "ok",
              total_reviews_analyzed: 30,
              themes: [],
              sentiment_summary: { positive: 0, neutral: 100, negative: 0 },
              target_user_segment: "",
              problem_statement: "",
              business_opportunity: "",
            }),
          },
        }],
      });

      const service = new GroqService();
      const reviews = Array.from({ length: 200 }, (_, i) => ({
        source: "google_play" as const,
        rating: 3,
        text: `Review ${i} about music recommendations`,
        review_date: "2026-03-15T00:00:00Z",
      }));

      const result = await service.analyzeReviews(reviews);
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(result.total_reviews_analyzed).toBe(30);
      expect(prompt).toContain("[Review 30]");
      expect(prompt).not.toContain("[Review 31]");
    });

    it("throws when Groq returns empty content", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const service = new GroqService();
      const reviews = [{ source: "google_play" as const, rating: 3, text: "Great app", review_date: "2026-03-15T00:00:00Z" }];
      await expect(service.analyzeReviews(reviews)).rejects.toThrow("Empty response from Groq API.");
    });

    it("throws when Groq API call fails", async () => {
      mockCreate.mockRejectedValue(new Error("Groq API 500"));

      const service = new GroqService();
      const reviews = [{ source: "google_play" as const, rating: 3, text: "Great app", review_date: "2026-03-15T00:00:00Z" }];
      await expect(service.analyzeReviews(reviews)).rejects.toThrow("Groq API 500");
    });

    it("returns parsed JSON on success", async () => {
      const mockAnalysis = {
        summary: "Users want fresh music.",
        total_reviews_analyzed: 1,
        themes: [],
        sentiment_summary: { positive: 20, neutral: 50, negative: 30 },
        target_user_segment: "Young listeners",
        problem_statement: "Recommendations are stale.",
        business_opportunity: "Add mood-aware discovery.",
      };
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
      });

      const service = new GroqService();
      const reviews = [{ source: "google_play" as const, rating: 2, text: "Too repetitive", review_date: "2026-03-15T00:00:00Z" }];
      const result = await service.analyzeReviews(reviews);
      expect(result.summary).toBe("Users want fresh music.");
    });
  });

  describe("generateRecommendations", () => {
    it("throws when Groq returns empty content", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const service = new GroqService();
      await expect(service.generateRecommendations({
        mood: "Chill",
        language: "Hindi",
        activity: "Studying",
        freshness: "Balanced",
        avoid: [],
      })).rejects.toThrow("Empty response from Groq API.");
    });

    it("returns empty recommendations when recommendations array is missing", async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ explanation: "ok" }) } }],
      });

      const service = new GroqService();
      const result = await service.generateRecommendations({
        mood: "Chill",
        language: "Hindi",
        activity: "Studying",
        freshness: "Balanced",
        avoid: [],
      });
      expect(result.recommendations).toEqual([]);
    });

    it("returns parsed recommendations on success", async () => {
      const mockResult = {
        recommendations: [
          { title: "Song A", artist_or_type: "Artist X", language_mood_fit: "Hindi chill", why_this_fits: "Study focused", how_fresh_this_is: "New release", freshness_label: "Fresh", avoids_repeating: "Not mainstream" },
        ],
        explanation: "Curated for studying.",
        query_used: "Chill Hindi Studying",
      };
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResult) } }],
      });

      const service = new GroqService();
      const result = await service.generateRecommendations({
        mood: "Chill",
        language: "Hindi",
        activity: "Studying",
        freshness: "Fresh",
        avoid: ["avoid_mainstream"],
      });
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0].title).toBe("Song A");
    });

    it("warns and returns when fewer than 8 recommendations returned", async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              recommendations: Array(5).fill({ title: "Song", artist_or_type: "A", language_mood_fit: "", why_this_fits: "", how_fresh_this_is: "", freshness_label: "Fresh", avoids_repeating: "" }),
              explanation: "",
              query_used: "",
            }),
          },
        }],
      });

      const service = new GroqService();
      const result = await service.generateRecommendations({
        mood: "Chill",
        language: "Hindi",
        activity: "Studying",
        freshness: "Fresh",
        avoid: [],
      });
      expect(result.recommendations.length).toBe(5);
    });
  });

  describe("singleton pattern", () => {
    it("returns the same instance on multiple calls", () => {
      const a = getGroqService();
      const b = getGroqService();
      expect(a).toBe(b);
    });
  });
});
