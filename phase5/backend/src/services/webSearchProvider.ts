import axios from "axios";
import { fetchWithRetry } from "../utils/http";
import { SourceAdapterDiagnostics } from "../types/review";

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  date?: string | null;
}

export interface WebSearchDiagnostics {
  provider: "brave" | "tavily" | "serpapi" | null;
  requestAttempted: boolean;
  statusCode: number | null;
  rawResponseShape: string | null;
  rawResultCount: number;
  normalizedResultCount: number;
  errorType: string | null;
  errorMessageSafe: string | null;
  queriesAttempted?: string[];
  sourceFilteredCount?: number;
  dateInferredCount?: number;
  dateDroppedCount?: number;
  finalAfterDateFilterCount?: number;
}

export function getConfiguredWebSearchProvider():
  | { provider: "brave" | "tavily" | "serpapi"; apiKey: string }
  | null {
  const provider = (process.env.WEB_SEARCH_PROVIDER || "").trim().toLowerCase();
  const genericKey = process.env.WEB_SEARCH_API_KEY?.trim();
  if (provider && !genericKey && !process.env.BRAVE_SEARCH_API_KEY && !process.env.TAVILY_API_KEY && !process.env.SERPAPI_API_KEY) {
    throw new Error("missing_web_search_api_key");
  }
  if ((provider === "brave" || process.env.BRAVE_SEARCH_API_KEY) && (genericKey || process.env.BRAVE_SEARCH_API_KEY?.trim())) {
    return { provider: "brave", apiKey: process.env.BRAVE_SEARCH_API_KEY?.trim() || genericKey! };
  }
  if ((provider === "tavily" || process.env.TAVILY_API_KEY) && (genericKey || process.env.TAVILY_API_KEY?.trim())) {
    return { provider: "tavily", apiKey: process.env.TAVILY_API_KEY?.trim() || genericKey! };
  }
  if ((provider === "serpapi" || process.env.SERPAPI_API_KEY) && (genericKey || process.env.SERPAPI_API_KEY?.trim())) {
    return { provider: "serpapi", apiKey: process.env.SERPAPI_API_KEY?.trim() || genericKey! };
  }
  return null;
}

export async function searchPublicWeb(query: string, limit = 10): Promise<WebSearchResult[]> {
  const { results } = await searchPublicWebWithDiagnostics(query, limit);
  return results;
}

export async function searchPublicWebWithDiagnostics(
  query: string,
  limit = 10
): Promise<{ results: WebSearchResult[]; diagnostics: WebSearchDiagnostics }> {
  let config: ReturnType<typeof getConfiguredWebSearchProvider>;
  try {
    config = getConfiguredWebSearchProvider();
  } catch (err) {
    if (err instanceof Error && err.message === "missing_web_search_api_key") throw err;
    throw new Error("missing_web_search_provider");
  }
  if (!config) throw new Error("missing_web_search_provider");

  if (config.provider === "brave") return searchBrave(query, config.apiKey, limit);
  if (config.provider === "tavily") return searchTavily(query, config.apiKey, limit);
  return searchSerpApi(query, config.apiKey, limit);
}

async function searchBrave(query: string, apiKey: string, limit: number): Promise<{ results: WebSearchResult[]; diagnostics: WebSearchDiagnostics }> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    }, 1);
    const raw = response.data?.web?.results ?? [];
    const results = raw.slice(0, limit).map((item: any) => ({
      title: item.title || "",
      snippet: item.description || "",
      url: item.url || "",
      date: item.page_age || null,
    })).filter(isUsefulResult);
    return { results, diagnostics: buildWebDiagnostics("brave", response.status, response.data, raw.length, results.length) };
  } catch (err) {
    throw enrichWebSearchError(err, "brave");
  }
}

async function searchTavily(query: string, apiKey: string, limit: number): Promise<{ results: WebSearchResult[]; diagnostics: WebSearchDiagnostics }> {
  try {
    const response = await axios.post("https://api.tavily.com/search", {
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: limit,
    }, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      timeout: 15000,
    });
    const raw = response.data?.results ?? [];
    const results = raw.slice(0, limit).map((item: any) => ({
      title: item.title || "",
      snippet: item.content || item.snippet || "",
      url: item.url || "",
      date: item.published_date || null,
    })).filter(isUsefulResult);
    return { results, diagnostics: buildWebDiagnostics("tavily", response.status, response.data, raw.length, results.length) };
  } catch (err) {
    throw enrichWebSearchError(err, "tavily");
  }
}

async function searchSerpApi(query: string, apiKey: string, limit: number): Promise<{ results: WebSearchResult[]; diagnostics: WebSearchDiagnostics }> {
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}&num=${limit}`;
  try {
    const response = await fetchWithRetry(url, { headers: { Accept: "application/json" } }, 1);
    const raw = response.data?.organic_results ?? [];
    const results = raw.slice(0, limit).map((item: any) => ({
      title: item.title || "",
      snippet: item.snippet || "",
      url: item.link || "",
      date: item.date || null,
    })).filter(isUsefulResult);
    return { results, diagnostics: buildWebDiagnostics("serpapi", response.status, response.data, raw.length, results.length) };
  } catch (err) {
    throw enrichWebSearchError(err, "serpapi");
  }
}

function isUsefulResult(result: WebSearchResult): boolean {
  return Boolean(result.title && result.snippet && result.url);
}

export function toSourceAdapterDiagnostics(
  source: SourceAdapterDiagnostics["source"],
  diagnostics: WebSearchDiagnostics,
  finalReason: string
): SourceAdapterDiagnostics {
  return {
    source,
    apiAttempted: diagnostics.requestAttempted,
    requestAttempted: diagnostics.requestAttempted,
    apiStatusCode: diagnostics.statusCode,
    apiErrorType: diagnostics.errorType,
    apiErrorMessageSafe: diagnostics.errorMessageSafe,
    rawResponseShape: diagnostics.rawResponseShape,
    rawResultCount: diagnostics.rawResultCount,
    normalizedResultCount: diagnostics.normalizedResultCount,
    finalReason,
    provider: diagnostics.provider,
    queriesAttempted: (diagnostics as any).queriesAttempted,
    sourceFilteredCount: (diagnostics as any).sourceFilteredCount,
    dateInferredCount: (diagnostics as any).dateInferredCount,
    dateDroppedCount: (diagnostics as any).dateDroppedCount,
    finalAfterDateFilterCount: (diagnostics as any).finalAfterDateFilterCount,
  };
}

function buildWebDiagnostics(
  provider: WebSearchDiagnostics["provider"],
  statusCode: number | null,
  data: any,
  rawResultCount: number,
  normalizedResultCount: number
): WebSearchDiagnostics {
  return {
    provider,
    requestAttempted: true,
    statusCode,
    rawResponseShape: describeShape(data),
    rawResultCount,
    normalizedResultCount,
    errorType: null,
    errorMessageSafe: null,
  };
}

function enrichWebSearchError(err: unknown, provider: WebSearchDiagnostics["provider"]): Error {
  const anyErr = err as any;
  const statusCode = anyErr?.response?.status ?? null;
  const data = anyErr?.response?.data;
  const message = err instanceof Error ? err.message : String(err);
  const safeMessage = statusCode ? `HTTP ${statusCode}` : message.slice(0, 120);
  const wrapped = new Error(`web_search_failed:${provider}:${safeMessage}`) as Error & { diagnostics?: WebSearchDiagnostics };
  wrapped.diagnostics = {
    provider,
    requestAttempted: true,
    statusCode,
    rawResponseShape: data ? describeShape(data) : null,
    rawResultCount: 0,
    normalizedResultCount: 0,
    errorType: statusCode ? "http_error" : "network_or_timeout",
    errorMessageSafe: safeMessage,
  };
  return wrapped;
}

export function describeShape(data: any): string {
  if (data === null || data === undefined) return String(data);
  if (Array.isArray(data)) return `array(${data.length})`;
  if (typeof data !== "object") return typeof data;
  const keys = Object.keys(data).slice(0, 8).join(",");
  return `object{${keys}}`;
}
