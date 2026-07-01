/**
 * Review Cleaner
 * Deduplicates, filters, and sanitises the raw review array produced
 * by all scrapers before it reaches the AI analysis engine.
 */
import { Review } from "../types/review";
import { removePii, isValidText } from "./piiRemover";

/** Simple djb2-style hash for dedup */
function hashText(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep 32-bit unsigned
  }
  return h.toString(16);
}

export interface CleanStats {
  input: number;
  removed_empty: number;
  removed_duplicate: number;
  removed_pii_wiped: number;
  pii_masked: number;
  output: number;
}

export function cleanReviews(raw: Review[]): { reviews: Review[]; stats: CleanStats } {
  const stats: CleanStats = {
    input: raw.length,
    removed_empty: 0,
    removed_duplicate: 0,
    removed_pii_wiped: 0,
    pii_masked: 0,
    output: 0,
  };

  const seen = new Set<string>();
  const cleaned: Review[] = [];

  for (const r of raw) {
    // 1. Drop empty / too-short reviews
    if (!isValidText(r.text)) {
      stats.removed_empty++;
      continue;
    }

    // 2. Deduplicate by text hash
    const hash = hashText(r.text.trim().toLowerCase());
    if (seen.has(hash)) {
      stats.removed_duplicate++;
      continue;
    }
    seen.add(hash);

    // 3. Remove PII
    const { cleaned: cleanedText, foundPii, piiTypes } = removePii(r.text);

    // If after PII removal the text is too short, drop it
    if (!isValidText(cleanedText)) {
      stats.removed_pii_wiped++;
      continue;
    }

    if (foundPii) stats.pii_masked++;

    cleaned.push({
      ...r,
      text: cleanedText,
      cleaned_text: cleanedText,
      pii_found: foundPii,
      cleaning_applied: [
        "duplicate_check",
        "empty_removed",
        ...(foundPii ? [`pii_masked:${piiTypes.join(",")}`] : []),
      ],
    });
  }

  stats.output = cleaned.length;
  return { reviews: cleaned, stats };
}
