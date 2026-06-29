/**
 * PII Remover
 * Strips personally identifiable information from review text before
 * it is stored or sent to the AI analysis engine.
 */

const PATTERNS: { name: string; regex: RegExp; replacement: string }[] = [
  {
    name: "email",
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: "[EMAIL]",
  },
  {
    name: "phone_indian",
    // Indian mobile numbers: +91XXXXXXXXXX or 9XXXXXXXXX or 07XXXXXXXXX
    regex: /(\+?91[-.\s]?)?[6-9]\d{9}/g,
    replacement: "[PHONE]",
  },
  {
    name: "phone_generic",
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g,
    replacement: "[PHONE]",
  },
  {
    name: "username_at",
    regex: /@[\w.]{2,30}/g,
    replacement: "[USERNAME]",
  },
  {
    name: "url",
    regex: /https?:\/\/[^\s]+/g,
    replacement: "[URL]",
  },
  {
    name: "order_id",
    // Patterns like ORDER-12345678, TXN-AB123456, etc.
    regex: /\b(ORDER|TXN|REF|TICKET|CASE)[#\-]?\s?[A-Z0-9]{6,20}\b/gi,
    replacement: "[ID]",
  },
];

export interface PiiResult {
  cleaned: string;
  foundPii: boolean;
  piiTypes: string[];
}

export function removePii(text: string): PiiResult {
  let cleaned = text;
  const piiTypes: string[] = [];

  for (const p of PATTERNS) {
    // Reset lastIndex for global regexes
    p.regex.lastIndex = 0;
    if (p.regex.test(cleaned)) {
      piiTypes.push(p.name);
    }
    p.regex.lastIndex = 0;
    cleaned = cleaned.replace(p.regex, p.replacement);
  }

  return { cleaned, foundPii: piiTypes.length > 0, piiTypes };
}

export function isValidText(text: string): boolean {
  return typeof text === "string" && text.trim().length >= 5;
}
