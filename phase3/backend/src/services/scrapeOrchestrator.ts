/**
 * Scrape Orchestrator
 * Runs all scrapers in parallel (with a concurrency cap so we don't
 * hammer every source simultaneously), merges results, and returns a
 * cleaned, deduplicated aggregate.
 */
import { ScrapeResult, AggregatedResult, ReviewSource } from "../types/review";
import { scrapeGooglePlay } from "../scrapers/googlePlayScraper";
import { scrapeAppStore } from "../scrapers/appStoreScraper";
import { scrapeReddit } from "../scrapers/redditScraper";
import { scrapeQuora } from "../scrapers/quoraScraper";
import { scrapeWebNews } from "../scrapers/webNewsScraper";
import { scrapeTwitter } from "../scrapers/twitterScraper";
import { cleanReviews } from "./reviewCleaner";
import { SCRAPE_FROM, toISO } from "../utils/dateFilter";

/** All available scraper functions keyed by source name */
const SCRAPERS: Record<ReviewSource, (fromDate?: Date, toDate?: Date) => Promise<ScrapeResult>> = {
  google_play: scrapeGooglePlay,
  app_store: scrapeAppStore,
  reddit: scrapeReddit,
  quora: scrapeQuora,
  web_news: scrapeWebNews,
  twitter_web: scrapeTwitter,
};

export type ScraperKey = ReviewSource;

/**
 * Run a subset (or all) scrapers, clean results, and return aggregate.
 * @param sources  Which sources to run; defaults to all.
 */
export async function runScraping(
  sources: ScraperKey[] = Object.keys(SCRAPERS) as ScraperKey[],
  fromDate?: Date,
  toDate?: Date
): Promise<AggregatedResult> {
  console.log(`[Orchestrator] Starting scrape for sources: ${sources.join(", ")} | range: ${fromDate ? fromDate.toISOString() : 'default'} to ${toDate ? toDate.toISOString() : 'default'}`);

  // Run all requested scrapers concurrently (max 3 at a time)
  const CONCURRENCY = 3;
  const results: ScrapeResult[] = [];

  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((src) => SCRAPERS[src](fromDate, toDate))
    );

    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        console.error("[Orchestrator] Scraper threw:", s.reason);
      }
    }
  }

  // Merge all reviews
  const allRaw = results.flatMap((r) => r.reviews);

  // Clean
  const { reviews: cleaned, stats } = cleanReviews(allRaw);

  // Build source counts
  const sourceCounts = {} as Record<ReviewSource, number>;
  for (const r of cleaned) {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
  }

  // Collect errors
  const errors = results
    .filter((r) => r.error)
    .map((r) => ({ source: r.source, message: r.error! }));

  console.log(
    `[Orchestrator] Done. Raw: ${allRaw.length} | Cleaned: ${cleaned.length} | ` +
      `Removed: ${stats.removed_empty + stats.removed_duplicate + stats.removed_pii_wiped}`
  );

  return {
    total: cleaned.length,
    date_range: {
      from: toISO(fromDate || SCRAPE_FROM),
      to: toISO(toDate || new Date()),
    },
    sources: sourceCounts,
    reviews: cleaned,
    errors,
  };
}
