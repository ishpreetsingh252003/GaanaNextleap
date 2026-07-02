/**
 * Quora scraper
 * Uses DuckDuckGo search to surface Quora snippets for Gaana-related content.
 */
import * as cheerio from "cheerio";
import { fetchWithRetry, sleep } from "../utils/http";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, SCRAPE_FROM } from "../utils/dateFilter";
import { randomUUID as uuid } from "crypto";

const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "1500", 10);

const QUERIES = [
  "site:quora.com gaana music app review 2026",
  "site:quora.com gaana app india opinion",
  "site:quora.com best indian music app gaana",
];

interface ParsedSnippet {
  title: string;
  snippet: string;
  url: string;
  date: string | null;
}

async function searchDDG(query: string): Promise<ParsedSnippet[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&df=y`;
  const res = await fetchWithRetry(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GaanaDiscoveryBot/5.0; +https://gaana-ai.vercel.app)",
      Accept: "text/html",
    },
  });

  const $ = cheerio.load(res.data as string);
  const results: ParsedSnippet[] = [];

  $(".result").each((_, el) => {
    const title = $(el).find(".result__title").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    const href = $(el).find(".result__url").text().trim();
    const dateText = $(el).find(".result__timestamp").text().trim();

    if (title && snippet && href.includes("quora.com")) {
      results.push({
        title,
        snippet,
        url: href.startsWith("http") ? href : `https://${href}`,
        date: dateText || null,
      });
    }
  });

  return results;
}

export async function scrapeQuora(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();

  try {
    for (const query of QUERIES) {
      await sleep(DELAY_MS);

      let snippets: ParsedSnippet[] = [];
      try {
        snippets = await searchDDG(query);
      } catch (err) {
        console.warn(`[Quora] DDG search failed for "${query}":`, err);
        continue;
      }

      for (const s of snippets) {
        if (!s.snippet || s.snippet.length < 20) continue;
        if (seenUrls.has(s.url)) continue;
        seenUrls.add(s.url);

        const date = s.date
          ? new Date(s.date).toISOString()
          : new Date().toISOString();

        if (!isWithinRange(date, fromDate, toDate)) continue;

        reviews.push({
          id: uuid(),
          source: "quora",
          rating: null,
          title: s.title,
          text: s.snippet,
          author: "quora_user",
          date,
          url: s.url,
          lang: "en",
        });
      }

      console.log(`[Quora] Query "${query}": ${snippets.length} snippets`);
    }

    return { source: "quora", fetched: reviews.length, reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Quora] Scrape failed:", msg);
    return { source: "quora", fetched: 0, reviews: [], error: msg };
  }
}
