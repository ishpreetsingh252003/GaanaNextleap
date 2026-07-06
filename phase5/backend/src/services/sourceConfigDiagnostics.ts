import { getConfiguredWebSearchProvider } from "./webSearchProvider";

export interface SourceConfigDiagnostics {
  appStoreAppIdPresent: boolean;
  appStoreAppIdLength: number;
  appStoreCountry: string;
  webSearchProviderRaw: string | null;
  webSearchProviderResolved: string | null;
  webSearchApiKeyPresent: boolean;
  webSearchApiKeyLength: number;
  tavilyApiKeyPresent: boolean;
  braveSearchApiKeyPresent: boolean;
  serpApiKeyPresent: boolean;
  redditUserAgentPresent: boolean;
  redditClientIdPresent: boolean;
  redditClientSecretPresent: boolean;
  nodeEnv: string | null;
  runtime: "render" | "local" | "unknown";
}

export function buildSourceConfigDiagnostics(): SourceConfigDiagnostics {
  let resolvedProvider: string | null = null;
  try {
    resolvedProvider = getConfiguredWebSearchProvider()?.provider ?? null;
  } catch {
    resolvedProvider = null;
  }

  return {
    appStoreAppIdPresent: Boolean(process.env.APP_STORE_APP_ID),
    appStoreAppIdLength: process.env.APP_STORE_APP_ID?.length ?? 0,
    appStoreCountry: (process.env.APP_STORE_COUNTRY || "IN").toUpperCase(),
    webSearchProviderRaw: process.env.WEB_SEARCH_PROVIDER || null,
    webSearchProviderResolved: resolvedProvider,
    webSearchApiKeyPresent: Boolean(process.env.WEB_SEARCH_API_KEY),
    webSearchApiKeyLength: process.env.WEB_SEARCH_API_KEY?.length ?? 0,
    tavilyApiKeyPresent: Boolean(process.env.TAVILY_API_KEY),
    braveSearchApiKeyPresent: Boolean(process.env.BRAVE_SEARCH_API_KEY),
    serpApiKeyPresent: Boolean(process.env.SERPAPI_API_KEY),
    redditUserAgentPresent: Boolean(process.env.REDDIT_USER_AGENT || "GaanaNextLeapReviewEngine/1.0"),
    redditClientIdPresent: Boolean(process.env.REDDIT_CLIENT_ID),
    redditClientSecretPresent: Boolean(process.env.REDDIT_CLIENT_SECRET),
    nodeEnv: process.env.NODE_ENV || null,
    runtime: detectRuntime(),
  };
}

function detectRuntime(): SourceConfigDiagnostics["runtime"] {
  if (process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.RENDER_EXTERNAL_URL) return "render";
  if (process.env.NODE_ENV === "development" || process.env.LOCALAPPDATA || process.env.HOME) return "local";
  return "unknown";
}
