import { fetchWithRetry } from "../utils/http";

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  date?: string | null;
}

export function getConfiguredWebSearchProvider():
  | { provider: "brave" | "tavily" | "serpapi"; apiKey: string }
  | null {
  const provider = (process.env.WEB_SEARCH_PROVIDER || "").toLowerCase();
  const genericKey = process.env.WEB_SEARCH_API_KEY;
  if ((provider === "brave" || process.env.BRAVE_SEARCH_API_KEY) && (genericKey || process.env.BRAVE_SEARCH_API_KEY)) {
    return { provider: "brave", apiKey: process.env.BRAVE_SEARCH_API_KEY || genericKey! };
  }
  if ((provider === "tavily" || process.env.TAVILY_API_KEY) && (genericKey || process.env.TAVILY_API_KEY)) {
    return { provider: "tavily", apiKey: process.env.TAVILY_API_KEY || genericKey! };
  }
  if ((provider === "serpapi" || process.env.SERPAPI_API_KEY) && (genericKey || process.env.SERPAPI_API_KEY)) {
    return { provider: "serpapi", apiKey: process.env.SERPAPI_API_KEY || genericKey! };
  }
  return null;
}

export async function searchPublicWeb(query: string, limit = 10): Promise<WebSearchResult[]> {
  const config = getConfiguredWebSearchProvider();
  if (!config) throw new Error("missing_web_search_provider");

  if (config.provider === "brave") return searchBrave(query, config.apiKey, limit);
  if (config.provider === "tavily") return searchTavily(query, config.apiKey, limit);
  return searchSerpApi(query, config.apiKey, limit);
}

async function searchBrave(query: string, apiKey: string, limit: number): Promise<WebSearchResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;
  const response = await fetchWithRetry(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  }, 1);
  const results = response.data?.web?.results ?? [];
  return results.slice(0, limit).map((item: any) => ({
    title: item.title || "",
    snippet: item.description || "",
    url: item.url || "",
    date: item.page_age || null,
  })).filter(isUsefulResult);
}

async function searchTavily(query: string, apiKey: string, limit: number): Promise<WebSearchResult[]> {
  const url = `https://api.tavily.com/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&max_results=${limit}`;
  const response = await fetchWithRetry(url, { headers: { Accept: "application/json" } }, 1);
  const results = response.data?.results ?? [];
  return results.slice(0, limit).map((item: any) => ({
    title: item.title || "",
    snippet: item.content || item.snippet || "",
    url: item.url || "",
    date: item.published_date || null,
  })).filter(isUsefulResult);
}

async function searchSerpApi(query: string, apiKey: string, limit: number): Promise<WebSearchResult[]> {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}&num=${limit}`;
  const response = await fetchWithRetry(url, { headers: { Accept: "application/json" } }, 1);
  const results = response.data?.organic_results ?? [];
  return results.slice(0, limit).map((item: any) => ({
    title: item.title || "",
    snippet: item.snippet || "",
    url: item.link || "",
    date: item.date || null,
  })).filter(isUsefulResult);
}

function isUsefulResult(result: WebSearchResult): boolean {
  return Boolean(result.title && result.snippet && result.url);
}
