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

  it("reports missing X bearer token without attempting brittle no-auth scraping", async () => {
    process.env = { ...originalEnv };
    delete process.env.X_BEARER_TOKEN;
    vi.resetModules();

    const { scrapeTwitter } = await import("../src/scrapers/twitterScraper");
    const result = await scrapeTwitter();

    expect(result.error).toBe("x_bearer_token_missing_public_no_auth_unavailable");
  });
});
