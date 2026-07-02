import { Review } from "./api";

export function cleanReviews(raw: Review[]): Review[] {
  const seen = new Set<string>();
  const cleaned: Review[] = [];

  for (const r of raw) {
    if (!r.text || r.text.trim().length < 5) continue;

    const hash = r.text.trim().toLowerCase();
    if (seen.has(hash)) continue;
    seen.add(hash);

    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?91[-.\s]?)?[6-9]\d{9}/g;
    const usernameRegex = /@[\w.]{2,30}/g;
    const urlRegex = /https?:\/\/[^\s]+/g;

    let text = r.text;
    text = text.replace(emailRegex, "[EMAIL]");
    text = text.replace(phoneRegex, "[PHONE]");
    text = text.replace(usernameRegex, "[USERNAME]");
    text = text.replace(urlRegex, "[URL]");

    if (text.trim().length < 5) continue;

    cleaned.push({
      ...r,
      text,
      cleaned_text: text,
      pii_found: text.includes("[EMAIL]") || text.includes("[PHONE]") || text.includes("[USERNAME]") || text.includes("[URL]"),
      cleaning_applied: ["duplicate_check", "empty_removed"],
    });
  }

  return cleaned;
}
