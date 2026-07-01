/**
 * Web / News scraper
 * Searches DuckDuckGo and Bing News for articles and forum posts mentioning
 * Gaana from 2026. Extracts text content using Cheerio.
 *
 * Targets:
 *  - Tech blogs (TechCrunch, AndroidPolice, 91Mobiles, etc.)
 *  - Twitter / X cards shown in search results (no API key needed)
 *  - Forum threads (XDA, MouthShut reviews, etc.)
 */
import * as cheerio from "cheerio";
import { fetchWithRetry, sleep } from "../utils/http";
import { Review, ScrapeResult } from "../types/review";
import { isWithinRange, SCRAPE_FROM } from "../utils/dateFilter";
import { randomUUID as uuid } from "crypto";

const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || "1500", 10);

const DDG_QUERIES = [
  "gaana music app review 2026 india",
  "gaana app problems complaints 2026",
  "gaana vs spotify vs jiosavan 2026",
  "gaana app update 2026 user feedback",
];

// Domain blocklist — skip irrelevant results
const BLOCKED_DOMAINS = [
  "amazon.com",
  "flipkart.com",
  "myntra.com",
  "youtube.com",
  "wikipedia.org",
];

interface SearchSnippet {
  title: string;
  snippet: string;
  url: string;
}

async function ddgSearch(query: string): Promise<SearchSnippet[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&df=y`;
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });

  const $ = cheerio.load(res.data as string);
  const results: SearchSnippet[] = [];

  $(".result").each((_, el) => {
    const title = $(el).find(".result__title").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    const href = $(el).find(".result__url").text().trim() || "";

    const fullUrl = href.startsWith("http") ? href : `https://${href}`;
    const isBlocked = BLOCKED_DOMAINS.some((d) => fullUrl.includes(d));

    if (title && snippet && !isBlocked) {
      results.push({ title, snippet, url: fullUrl });
    }
  });

  return results;
}

/**
 * Try to scrape the article/page body for richer content.
 * Falls back gracefully to the search snippet on failure.
 */
async function scrapePageContent(url: string): Promise<string | null> {
  try {
    await sleep(1000);
    const res = await fetchWithRetry(url, {}, 1);
    const $ = cheerio.load(res.data as string);

    // Remove nav, header, footer, scripts
    $("nav, header, footer, script, style, aside").remove();

    // Try common article selectors
    const selectors = [
      "article",
      ".post-content",
      ".entry-content",
      ".review-body",
      "main p",
      ".comment",
      ".user-review",
    ];

    for (const sel of selectors) {
      const text = $(sel).text().trim();
      if (text.length > 100) return text.slice(0, 800);
    }

    return $("body").text().trim().slice(0, 800);
  } catch {
    return null;
  }
}

export async function scrapeWebNews(
  fromDate: Date = SCRAPE_FROM,
  toDate: Date = new Date()
): Promise<ScrapeResult> {
  const reviews: Review[] = [];
  const seenUrls = new Set<string>();

  try {
    for (const query of DDG_QUERIES) {
      await sleep(DELAY_MS);

      let snippets: SearchSnippet[] = [];
      try {
        snippets = await ddgSearch(query);
      } catch (e) {
        console.warn(`[WebNews] DDG search failed for "${query}":`, e);
        continue;
      }

      for (const s of snippets) {
        if (seenUrls.has(s.url)) continue;
        seenUrls.add(s.url);

        // Attempt richer scrape
        const pageText = await scrapePageContent(s.url);
        const finalText = pageText || s.snippet;

        if (!finalText || finalText.length < 30) continue;

        // Use today's date as proxy — web content from current search is recent
        const date = new Date().toISOString();
        if (!isWithinRange(date, fromDate, toDate)) continue;

        reviews.push({
          id: uuid(),
          source: "web_news",
          rating: null,
          title: s.title,
          text: finalText,
          author: "web_article",
          date,
          url: s.url,
          lang: "en",
        });
      }

      console.log(`[WebNews] Query "${query}": ${snippets.length} results`);
    }

    return { source: "web_news", fetched: reviews.length, reviews };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WebNews] Scrape failed:", msg);
    return { source: "web_news", fetched: 0, reviews: [], error: msg };
  }
}
