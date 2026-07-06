import { readFileSync } from "fs";
import { resolve } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

const axiosPostMock = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: vi.fn(),
    }),
    post: axiosPostMock,
  },
}));

describe("review source adapters", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
    vi.doUnmock("../src/services/webSearchProvider");
    vi.doUnmock("../src/utils/http");
    vi.clearAllMocks();
  });

  it("parses App Store RSS review entries", async () => {
    const { parseAppStoreRssReviews } = await import("../src/scrapers/appStoreScraper");
    const reviews = parseAppStoreRssReviews({
      feed: {
        entry: [
          { title: { label: "Gaana Music" } },
          {
            id: { label: "review-1" },
            title: { label: "Same songs" },
            content: { label: "Recommendations keep repeating the same songs." },
            updated: { label: "2026-07-01T10:00:00Z" },
            "im:rating": { label: "2" },
            author: { name: { label: "listener" } },
          },
        ],
      },
    }, "12345", "in");

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      id: "review-1",
      source: "app_store",
      rating: 2,
      title: "Same songs",
      date: "2026-07-01",
    });
  });

  it("returns missing_app_store_app_id when App Store app id is not configured", async () => {
    process.env = { ...originalEnv };
    delete process.env.APP_STORE_APP_ID;
    vi.resetModules();

    const { scrapeAppStore } = await import("../src/scrapers/appStoreScraper");
    const result = await scrapeAppStore();

    expect(result.error).toBe("missing_app_store_app_id");
    expect(result.reviews).toEqual([]);
  });

  it("gets a Reddit OAuth token when credentials are configured", async () => {
    process.env = {
      ...originalEnv,
      REDDIT_CLIENT_ID: "client",
      REDDIT_CLIENT_SECRET: "secret",
    };
    axiosPostMock.mockResolvedValue({ data: { access_token: "token-123" } });
    vi.resetModules();

    const { getRedditOAuthToken } = await import("../src/scrapers/redditScraper");

    await expect(getRedditOAuthToken()).resolves.toBe("token-123");
  });

  it("uses Reddit web search when OAuth is missing and web search is configured", async () => {
    process.env = {
      ...originalEnv,
      WEB_SEARCH_PROVIDER: "brave",
      WEB_SEARCH_API_KEY: "search-key",
    };
    delete process.env.REDDIT_CLIENT_ID;
    delete process.env.REDDIT_CLIENT_SECRET;

    const searchPublicWebMock = vi.fn(async (query: string) => [{
      title: `Reddit discussion for ${query}`,
      snippet: "Listeners discuss Gaana recommendations and repeated music discovery loops.",
      url: `https://www.reddit.com/r/india/comments/${encodeURIComponent(query)}`,
      date: null,
    }]);
    vi.doMock("../src/services/webSearchProvider", () => ({ searchPublicWeb: searchPublicWebMock }));
    vi.resetModules();

    const { scrapeReddit } = await import("../src/scrapers/redditScraper");
    const result = await scrapeReddit(new Date("2026-01-01"), new Date("2026-12-31"));

    expect(searchPublicWebMock).toHaveBeenCalled();
    expect(result.error).toBe("reddit_auth_missing_using_web_search");
    expect(result.reviews.length).toBeGreaterThan(0);
    expect(result.reviews.every((review) => review.source === "reddit")).toBe(true);
  });

  it("normalizes Reddit web search results as source reddit", async () => {
    const { normalizeRedditSearchResults } = await import("../src/scrapers/redditScraper");

    const reviews = normalizeRedditSearchResults([{
      title: "Gaana recommendations thread",
      snippet: "People compare Gaana discovery with other music apps.",
      url: "https://www.reddit.com/r/india/comments/abc123/gaana",
      date: "2026-07-01",
    }], new Date("2026-01-01"), new Date("2026-12-31"));

    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      source: "reddit",
      rating: null,
      date: "2026-07-01",
    });
  });

  it("deduplicates repeated Reddit web search URLs", async () => {
    const { normalizeRedditSearchResults } = await import("../src/scrapers/redditScraper");
    const repeated = {
      title: "Gaana same songs",
      snippet: "A public Reddit result about repeated recommendations.",
      url: "https://www.reddit.com/r/india/comments/repeat/gaana?utm_source=search",
      date: "2026-07-01",
    };

    const reviews = normalizeRedditSearchResults([
      repeated,
      { ...repeated, url: "https://www.reddit.com/r/india/comments/repeat/gaana#comments" },
    ], new Date("2026-01-01"), new Date("2026-12-31"));

    expect(reviews).toHaveLength(1);
  });

  it("keeps Reddit web search results with missing dates in the selected range", async () => {
    const { normalizeRedditSearchResults } = await import("../src/scrapers/redditScraper");

    const reviews = normalizeRedditSearchResults([{
      title: "Gaana public Reddit result",
      snippet: "Search snippet without a published date still carries useful public discussion signal.",
      url: "https://www.reddit.com/r/IndianMusic/comments/no_date/gaana",
      date: null,
    }], new Date("2000-01-01"), new Date("2100-01-01"));

    expect(reviews).toHaveLength(1);
    expect(reviews[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to Reddit public JSON when web search is unavailable", async () => {
    process.env = { ...originalEnv };
    delete process.env.REDDIT_CLIENT_ID;
    delete process.env.REDDIT_CLIENT_SECRET;
    delete process.env.WEB_SEARCH_PROVIDER;
    delete process.env.WEB_SEARCH_API_KEY;

    vi.doMock("../src/services/webSearchProvider", () => ({
      searchPublicWeb: vi.fn(async () => {
        throw new Error("missing_web_search_provider");
      }),
    }));
    vi.doMock("../src/utils/http", () => ({
      fetchWithRetry: vi.fn(async () => ({
        data: {
          data: {
            children: [{
              kind: "t3",
              data: {
                id: "public-json-1",
                title: "Gaana music discovery",
                selftext: "Public Reddit JSON result about repeated Gaana recommendations.",
                author: "listener",
                created_utc: Date.UTC(2026, 6, 1) / 1000,
                permalink: "/r/india/comments/public-json-1/gaana",
              },
            }],
          },
        },
      })),
    }));
    vi.resetModules();

    const { scrapeReddit } = await import("../src/scrapers/redditScraper");
    const result = await scrapeReddit(new Date("2026-01-01"), new Date("2026-12-31"));

    expect(result.error).toBe("reddit_public_json_succeeded");
    expect(result.reviews).toHaveLength(1);
  });

  it("returns a limited Reddit diagnostic instead of throwing when live paths fail", async () => {
    process.env = { ...originalEnv };
    delete process.env.REDDIT_CLIENT_ID;
    delete process.env.REDDIT_CLIENT_SECRET;

    vi.doMock("../src/services/webSearchProvider", () => ({
      searchPublicWeb: vi.fn(async () => {
        throw new Error("missing_web_search_provider");
      }),
    }));
    vi.doMock("../src/utils/http", () => ({
      fetchWithRetry: vi.fn(async () => {
        throw new Error("source_timeout");
      }),
    }));
    vi.resetModules();

    const { scrapeReddit } = await import("../src/scrapers/redditScraper");

    await expect(scrapeReddit()).resolves.toMatchObject({
      source: "reddit",
      fetched: 0,
      reviews: [],
      error: "reddit_auth_missing_public_fetch_limited",
    });
  });

  it("reports missing_web_search_provider for Web/News without provider credentials", async () => {
    process.env = { ...originalEnv };
    delete process.env.WEB_SEARCH_PROVIDER;
    delete process.env.WEB_SEARCH_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    vi.resetModules();

    const { scrapeWebNews } = await import("../src/scrapers/webNewsScraper");
    const result = await scrapeWebNews();

    expect(result.error).toBe("missing_web_search_provider");
  });

  it("reports missing_web_search_provider for Quora/community without provider credentials", async () => {
    process.env = { ...originalEnv };
    delete process.env.WEB_SEARCH_PROVIDER;
    delete process.env.WEB_SEARCH_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    vi.resetModules();

    const { scrapeQuora } = await import("../src/scrapers/quoraScraper");
    const result = await scrapeQuora();

    expect(result.error).toBe("missing_web_search_provider");
  });

  it("reports missing_web_search_api_key when provider is configured without a key", async () => {
    process.env = { ...originalEnv, WEB_SEARCH_PROVIDER: "brave" };
    delete process.env.WEB_SEARCH_API_KEY;
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPAPI_API_KEY;
    vi.resetModules();

    const { scrapeWebNews } = await import("../src/scrapers/webNewsScraper");
    const result = await scrapeWebNews();

    expect(result.error).toBe("missing_web_search_api_key");
  });

  it("reports missing X bearer token without attempting brittle no-auth scraping", async () => {
    process.env = { ...originalEnv };
    delete process.env.X_BEARER_TOKEN;
    vi.resetModules();

    const { scrapeTwitter } = await import("../src/scrapers/twitterScraper");
    const result = await scrapeTwitter();

    expect(result.error).toBe("x_bearer_token_missing_public_no_auth_unavailable");
  });

  it("keeps Reddit web search diagnostic labels user-readable in the frontend", () => {
    const reviewsPage = readFileSync(
      resolve(process.cwd(), "../frontend/app/reviews/page.tsx"),
      "utf8"
    );

    expect(reviewsPage).toContain("reddit_web_search_succeeded");
    expect(reviewsPage).toContain("Reddit public discussions via web search.");
    expect(reviewsPage).toContain("reddit_auth_missing_using_web_search");
    expect(reviewsPage).toContain("Reddit OAuth unavailable; using public Reddit search results.");
  });
});
