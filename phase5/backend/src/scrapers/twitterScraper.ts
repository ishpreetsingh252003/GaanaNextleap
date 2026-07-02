/**
 * Twitter / X scraper
 * Uses Nitter mirror instances (no auth required) to scrape public tweets.
 */
import * as cheerio from "cheerio";
import { fetchWithRetry, sleep } from "../utils/http";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, SCRAPE_FROM } from "../utils/dateFilter";
import { randomUUID as uuid } from "crypto";

const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "1500", 10);

const NITTER_INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.1d4.us",
];

const SEARCH_QUERIES = [
  "gaana app",
  "gaana music india",
  "gaana recommendation",
];

interface Tweet {
  text: string;
  author: string;
  date: string;
  url: string;
}

async function scrapeTweetsFromNitter(
  instance: string,
  query: string
): Promise<Tweet[]> {
  const url = `${instance}/search?q=${encodeURIComponent(query)}&f=tweets`;
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GaanaBot/5.0)" },
  }, 0);

  const $ = cheerio.load(res.data as string);
  const tweets: Tweet[] = [];

  $(".timeline-item").each((_, el) => {
    const text = $(el).find(".tweet-content").text().trim();
    const author = $(el).find(".fullname").text().trim() || "twitter_user";
    const dateEl = $(el).find(".tweet-date a");
    const dateStr = dateEl.attr("title") || dateEl.text().trim();
    const tweetPath = dateEl.attr("href") || "";

    if (!text || text.length < 10) return;

    let parsedDate: string;
    try {
      parsedDate = new Date(dateStr.split("·")[0].trim()).toISOString();
    } catch {
      parsedDate = new Date().toISOString();
    }

    tweets.push({
      text,
      author,
      date: parsedDate,
      url: tweetPath ? `${instance}${tweetPath}` : instance,
    });
  });

  return tweets;
}

export async function scrapeTwitter(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenTexts = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    let succeeded = false;

    for (const instance of NITTER_INSTANCES) {
      await sleep(DELAY_MS);

      try {
        const tweets = await scrapeTweetsFromNitter(instance, query);

        for (const t of tweets) {
          if (!isWithinRange(t.date, fromDate, toDate)) continue;
          const key = t.text.slice(0, 60);
          if (seenTexts.has(key)) continue;
          seenTexts.add(key);

          reviews.push({
            id: uuid(),
            source: "twitter_web",
            rating: null,
            title: "",
            text: t.text,
            author: t.author,
            date: t.date,
            url: t.url,
            lang: "en",
          });
        }

        console.log(
          `[Twitter] Instance ${instance} query "${query}": ${tweets.length} tweets`
        );
        succeeded = true;
        break;
      } catch (err) {
        console.warn(`[Twitter] Instance ${instance} failed:`, err);
        continue;
      }
    }

    if (!succeeded) {
      console.warn(`[Twitter] All Nitter instances failed for query "${query}"`);
    }
  }

  return { source: "twitter_web", fetched: reviews.length, reviews };
}
