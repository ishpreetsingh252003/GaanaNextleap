/**
 * Google Play Store scraper
 * Uses google-play-scraper v10 which calls Google's internal API.
 * Paginates through reviews sorted by NEWEST and stops once dates go
 * before Jan 2026.
 */
import gplay from "google-play-scraper";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, toISO } from "../utils/dateFilter";
import { sleep } from "../utils/http";
import { randomUUID as uuid } from "crypto";

const APP_ID = process.env.GOOGLE_PLAY_APP_ID || "com.gaana";
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "1500", 10);
const MAX_PAGES = parseInt(process.env.MAX_PAGES_PER_SOURCE || "5", 10);
const PAGE_SIZE = 100;

export async function scrapeGooglePlay(): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  let consecutiveOldCount = 0;
  let nextToken: string | undefined;

  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      await sleep(DELAY_MS);

      // v10 API: reviews() returns { data, nextPaginationToken }
      const result = await (gplay as any).reviews({
        appId: APP_ID,
        lang: "en",
        country: "in",
        sort: (gplay as any).sort?.NEWEST ?? 2,
        num: PAGE_SIZE,
        nextPaginationToken: nextToken,
      });

      const items: any[] = Array.isArray(result) ? result : (result?.data ?? []);
      nextToken = Array.isArray(result) ? undefined : result?.nextPaginationToken;

      if (!items.length) break;

      let addedThisPage = 0;
      for (const r of items) {
        const dateStr = r.date ? toISO(new Date(r.date)) : "";
        if (!isWithinRange(dateStr)) {
          consecutiveOldCount++;
          if (consecutiveOldCount >= 20) break;
          continue;
        }
        consecutiveOldCount = 0;

        reviews.push({
          id: uuid(),
          source: "google_play",
          rating: r.score ?? null,
          title: r.title || "",
          text: r.text || "",
          author: r.userName || "Anonymous",
          date: dateStr,
          url: `https://play.google.com/store/apps/details?id=${APP_ID}`,
          lang: "en",
        });
        addedThisPage++;
      }

      console.log(`[GooglePlay] Page ${page + 1}: +${addedThisPage} (total: ${reviews.length})`);
      if (consecutiveOldCount >= 20 || !nextToken) break;
    }

    return { source: "google_play", fetched: reviews.length, reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GooglePlay] Scrape failed:", msg);
    return { source: "google_play", fetched: 0, reviews: [], error: msg };
  }
}
