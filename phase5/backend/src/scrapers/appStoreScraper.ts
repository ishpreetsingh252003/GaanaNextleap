/**
 * Apple App Store scraper
 * Uses the `app-store-scraper` npm package which calls Apple's RSS/API.
 */
import store from "app-store-scraper";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, toISO, SCRAPE_FROM } from "../utils/dateFilter";
import { sleep } from "../utils/http";
import { randomUUID as uuid } from "crypto";

const APP_ID = parseInt(process.env.APP_STORE_APP_ID || "1491726408", 10);
const COUNTRY = process.env.APP_STORE_COUNTRY || "in";
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "250", 10);
const MAX_PAGES = parseInt(process.env.MAX_PAGES_PER_SOURCE || "6", 10);

export async function scrapeAppStore(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      await sleep(DELAY_MS);

      const raw: any[] = await store.reviews({
        id: APP_ID,
        country: COUNTRY,
        page,
        sort: store.sort.RECENT,
      });

      if (!raw || raw.length === 0) break;

      let addedThisPage = 0;
      let oldCount = 0;

      for (const r of raw) {
        const dateStr = r.updated ? toISO(new Date(r.updated)) : "";
        if (!isWithinRange(dateStr, fromDate, toDate)) {
          if (r.updated && new Date(r.updated) < fromDate) {
            oldCount++;
          }
          if (oldCount >= 15) break;
          continue;
        }
        oldCount = 0;

        reviews.push({
          id: uuid(),
          source: "app_store",
          rating: r.score ?? null,
          title: r.title || "",
          text: r.text || "",
          author: r.userName || "Anonymous",
          date: dateStr,
          url: `https://apps.apple.com/${COUNTRY}/app/id${APP_ID}`,
          lang: "en",
        });
        addedThisPage++;
      }

      console.log(`[AppStore] Page ${page}: +${addedThisPage} reviews (total: ${reviews.length})`);

      if (oldCount >= 15) break;
    }

    return { source: "app_store", fetched: reviews.length, reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AppStore] Scrape failed:", msg);
    return { source: "app_store", fetched: 0, reviews: [], error: msg };
  }
}
