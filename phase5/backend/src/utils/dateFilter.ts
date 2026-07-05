/** Jan 1, 2026 – scrape from this year onwards */
export const SCRAPE_FROM = new Date("2026-01-01T00:00:00.000Z");

export function normalizeReviewDate(input: string | number | Date | null | undefined): string | null {
  if (input === null || input === undefined || input === "") return null;
  const date =
    typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? new Date(`${input}T12:00:00.000Z`)
      : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function isWithinRange(
  dateStr: string | null | undefined,
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): boolean {
  const normalized = normalizeReviewDate(dateStr);
  if (!normalized) return false;
  const d = new Date(`${normalized}T12:00:00.000Z`);
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

export function toISO(date: Date | number): string {
  return normalizeReviewDate(date) ?? new Date(date).toISOString().slice(0, 10);
}
