import { describe, it, expect } from "vitest";
import { cleanReviews } from "../src/services/reviewCleaner";

const makeReview = (text: string, source = "google_play"): any => ({
  source,
  rating: 3,
  text,
  review_date: "2026-03-15T00:00:00Z",
});

describe("reviewCleaner", () => {
  describe("cleanReviews", () => {
    it("returns empty reviews for empty input", () => {
      const { reviews, stats } = cleanReviews([]);
      expect(reviews).toEqual([]);
      expect(stats).toEqual({
        input: 0,
        removed_empty: 0,
        removed_too_short: 0,
        removed_language: 0,
        removed_duplicate: 0,
        removed_invalid_date: 0,
        removed_pii_wiped: 0,
        pii_masked: 0,
        output: 0,
      });
    });

    it("removes empty and too-short reviews", () => {
      const raw = [
        makeReview("ab"),
        makeReview("123"),
        makeReview("   "),
        makeReview("This is a valid review with enough content"),
      ];
      const { reviews, stats } = cleanReviews(raw);
      expect(reviews).toHaveLength(1);
      expect(stats.removed_empty).toBe(1);
      expect(stats.removed_too_short).toBe(2);
      expect(stats.output).toBe(1);
    });

    it("removes exact duplicate reviews by text hash", () => {
      const raw = [
        makeReview("Great app, love the new features!"),
        makeReview("Great app, love the new features!"),
        makeReview("Different review here"),
      ];
      const { reviews, stats } = cleanReviews(raw);
      expect(reviews).toHaveLength(2);
      expect(stats.removed_duplicate).toBe(1);
    });

    it("removes PII and counts masked reviews", () => {
      const raw = [
        makeReview("Contact me at john@example.com"),
        makeReview("Call 9876543210 for support"),
        makeReview("No personal info here, just a normal review"),
      ];
      const { reviews, stats } = cleanReviews(raw);
      expect(reviews).toHaveLength(3);
      expect(stats.pii_masked).toBe(2);
    });

    it("removes reviews that become too short after PII removal", () => {
      const raw = [
        makeReview("ORDER-12345678"),
        makeReview("This is a solid review with enough text to survive"),
      ];
      const { reviews, stats } = cleanReviews(raw);
      expect(reviews).toHaveLength(1);
      expect(stats.removed_pii_wiped).toBe(1);
      expect(reviews[0].text).toBe("This is a solid review with enough text to survive");
    });

    it("preserves original review fields and adds cleaning metadata", () => {
      const raw = [makeReview("Review text here")];
      const { reviews } = cleanReviews(raw);
      expect(reviews[0]).toMatchObject({
        source: "google_play",
        rating: 3,
        review_date: "2026-03-15T00:00:00Z",
      });
      expect(reviews[0].cleaned_text).toBeDefined();
      expect(Array.isArray(reviews[0].cleaning_applied)).toBe(true);
      expect(reviews[0].cleaning_applied).toContain("duplicate_check");
      expect(reviews[0].cleaning_applied).toContain("empty_removed");
    });

    it("calculates stats correctly for complex input", () => {
      const raw = [
        makeReview("ok"),
        makeReview("Great app!"),
        makeReview("Great app!"),
        makeReview("ORDER-12345678"),
        makeReview("Worth it, good service"),
        makeReview("Worth it, good service"),
        makeReview("Best music app ever"),
      ];
      const { stats } = cleanReviews(raw);
      expect(stats.input).toBe(7);
      expect(stats.removed_too_short).toBe(1);
      expect(stats.removed_duplicate).toBe(2);
      expect(stats.removed_pii_wiped).toBe(1);
      expect(stats.output).toBe(3);
    });

    it("sets pii_found flag correctly", () => {
      const raw = [
        makeReview("No PII here at all"),
        makeReview("Contact test@example.com please"),
      ];
      const { reviews } = cleanReviews(raw);
      expect(reviews[0].pii_found).toBe(false);
      expect(reviews[1].pii_found).toBe(true);
    });

    it("is case-insensitive for deduplication", () => {
      const raw = [
        makeReview("Great App"),
        makeReview("great app"),
        makeReview("Great app"),
      ];
      const { reviews, stats } = cleanReviews(raw);
      expect(reviews).toHaveLength(1);
      expect(stats.removed_duplicate).toBe(2);
    });

    it("handles reviews with newlines and extra whitespace", () => {
      const raw = [
        makeReview("  \n  Love this app!  \n  "),
        makeReview("Not bad"),
      ];
      const { reviews } = cleanReviews(raw);
      expect(reviews).toHaveLength(2);
      expect(reviews[0].text).toMatch(/Love this app!/);
    });

    it("keeps short meaningful recommendation feedback", () => {
      const { reviews, stats } = cleanReviews([
        makeReview("recommendations are repetitive"),
      ]);

      expect(reviews).toHaveLength(1);
      expect(stats.removed_too_short).toBe(0);
    });

    it("does not remove Hinglish feedback by default", () => {
      const { reviews } = cleanReviews([
        makeReview("Gaane repeat ho rahe hain, fresh songs chahiye"),
      ]);

      expect(reviews).toHaveLength(1);
    });

    it("dedupes exact duplicate bodies only within the same source", () => {
      const raw = [
        makeReview("Same songs repeat every day", "google_play"),
        makeReview("Same songs repeat every day", "google_play"),
        makeReview("Same songs repeat every day", "reddit"),
      ];
      const { reviews, stats } = cleanReviews(raw);

      expect(reviews).toHaveLength(2);
      expect(stats.removed_duplicate).toBe(1);
    });
  });
});
