/** Jan 1, 2026 – scrape from this year onwards */
export const SCRAPE_FROM = new Date("2026-01-01T00:00:00.000Z");

export function isWithinRange(
  dateStr: string | null | undefined,
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d >= fromDate && d <= toDate;
  } catch {
    return false;
  }
}

export function toISO(date: Date | number): string {
  return new Date(date).toISOString();
}
