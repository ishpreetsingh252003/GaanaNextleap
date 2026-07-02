import { describe, it, expect } from "vitest";
import { removePii, isValidText } from "../src/services/piiRemover";

describe("piiRemover", () => {
  describe("isValidText", () => {
    it("returns true for valid long strings", () => {
      expect(isValidText("This is a normal review text.")).toBe(true);
    });

    it("returns true for string of exactly 5 characters", () => {
      expect(isValidText("12345")).toBe(true);
    });

    it("returns false for strings shorter than 5 characters", () => {
      expect(isValidText("Hi")).toBe(false);
      expect(isValidText("1234")).toBe(false);
      expect(isValidText("")).toBe(false);
    });

    it("returns false for whitespace-only strings", () => {
      expect(isValidText("     ")).toBe(false);
      expect(isValidText("  1  ")).toBe(false);
    });

    it("returns false for non-string input", () => {
      expect(isValidText(null as any)).toBe(false);
      expect(isValidText(undefined as any)).toBe(false);
      expect(isValidText(123 as any)).toBe(false);
    });
  });

  describe("removePii", () => {
    it("masks email addresses", () => {
      const result = removePii("Contact me at john.doe@gmail.com please");
      expect(result.cleaned).toBe("Contact me at [EMAIL] please");
      expect(result.foundPii).toBe(true);
      expect(result.piiTypes).toContain("email");
    });

    it("masks multiple emails", () => {
      const result = removePii("Reach out at a@b.com or c@d.co.uk");
      expect(result.cleaned).toBe("Reach out at [EMAIL] or [EMAIL]");
      expect(result.piiTypes).toContain("email");
    });

    it("masks Indian mobile numbers", () => {
      const result = removePii("Call me on 9876543210 or +919876543210");
      expect(result.cleaned).toBe("Call me on [PHONE] or [PHONE]");
      expect(result.piiTypes).toContain("phone_indian");
    });

    it("masks generic phone numbers", () => {
      const result = removePii("Office: (555) 123-4567 or 555-123-4567");
      expect(result.cleaned).toBe("Office: [PHONE] or [PHONE]");
      expect(result.piiTypes).toContain("phone_generic");
    });

    it("masks usernames starting with @", () => {
      const result = removePii("Follow @johndoe on social media");
      expect(result.cleaned).toBe("Follow [USERNAME] on social media");
      expect(result.piiTypes).toContain("username_at");
    });

    it("masks URLs", () => {
      const result = removePii("See https://example.com for details");
      expect(result.cleaned).toBe("See [URL] for details");
      expect(result.piiTypes).toContain("url");
    });

    it("masks order IDs", () => {
      const result = removePii("My order ORDER-12345678 is delayed");
      expect(result.cleaned).toBe("My order [ID] is delayed");
      expect(result.piiTypes).toContain("order_id");
    });

    it("masks transaction IDs", () => {
      const result = removePii("Refund for TXN-AB123456 not received");
      expect(result.cleaned).toBe("Refund for [ID] not received");
      expect(result.piiTypes).toContain("order_id");
    });

    it("handles multiple PII types in one string", () => {
      const result = removePii("Email user@example.com or call 9876543210");
      expect(result.cleaned).toBe("Email [EMAIL] or call [PHONE]");
      expect(result.piiTypes).toHaveLength(2);
      expect(result.piiTypes).toContain("email");
      expect(result.piiTypes).toContain("phone_indian");
    });

    it("returns unchanged string with no PII", () => {
      const input = "This app has great music and nice playlists";
      const result = removePii(input);
      expect(result.cleaned).toBe(input);
      expect(result.foundPii).toBe(false);
      expect(result.piiTypes).toEqual([]);
    });

    it("returns false for foundPii when input is empty", () => {
      const result = removePii("");
      expect(result.cleaned).toBe("");
      expect(result.foundPii).toBe(false);
    });

    it("preserves text without matched patterns", () => {
      const result = removePii("I love the new UI but wish there were more regional songs");
      expect(result.cleaned).toBe("I love the new UI but wish there were more regional songs");
      expect(result.foundPii).toBe(false);
    });

    it("masks email with special characters", () => {
      const result = removePii("Contact: user.name+tag@sub.domain.co.in");
      expect(result.cleaned).toBe("Contact: [EMAIL]");
    });

    it("masks phone with country code and spaces", () => {
      const result = removePii("+91 98765 43210");
      expect(result.cleaned).toBe("[PHONE]");
    });

    it("does not mask numbers that are not phone-like", () => {
      const result = removePii("I rated it 5 stars out of 5");
      expect(result.cleaned).toBe("I rated it 5 stars out of 5");
      expect(result.foundPii).toBe(false);
    });
  });
});
