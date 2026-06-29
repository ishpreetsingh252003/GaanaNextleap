/** Jan 1, 2026 – scrape from this year onwards */
export const SCRAPE_FROM = new Date("2026-01-01T00:00:00.000Z");

/**
 * Returns true if the review date is within the desired range
 * (Jan 1 2026 → now).
 */
export function isWithinRange(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d >= SCRAPE_FROM && d <= new Date();
  } catch {
    return false;
  }
}

/** Format a Date object to ISO 8601 string */
export function toISO(date: Date | number): string {
  return new Date(date).toISOString();
}
