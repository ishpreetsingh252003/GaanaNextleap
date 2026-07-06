import {
  filterReviews,
  getFallbackReviewDataset,
  getFetcherType,
  ReviewFilters,
  VALID_REVIEW_SOURCES,
} from "../services/analysisService";
import { runScraping } from "../services/scrapeOrchestrator";
import { buildSourceConfigDiagnostics } from "../services/sourceConfigDiagnostics";
import { SourceAdapterDiagnostics } from "../types/review";

const startDate = process.argv[2] || "2026-01-01";
const endDate = process.argv[3] || new Date().toISOString().slice(0, 10);
const dataset = getFallbackReviewDataset();

void main();

async function main() {
  console.log(`Review source diagnostics (${startDate} to ${endDate})`);
  const config = buildSourceConfigDiagnostics();
  console.log("Backend source config:");
  console.log(`- App Store ID present: ${config.appStoreAppIdPresent} (length=${config.appStoreAppIdLength})`);
  console.log(`- App Store country: ${config.appStoreCountry}`);
  console.log(`- Web provider raw: ${config.webSearchProviderRaw ?? "none"}`);
  console.log(`- Web provider resolved: ${config.webSearchProviderResolved ?? "none"}`);
  console.log(`- Generic web key present: ${config.webSearchApiKeyPresent} (length=${config.webSearchApiKeyLength})`);
  console.log(`- Tavily key present: ${config.tavilyApiKeyPresent}`);
  console.log(`- Brave key present: ${config.braveSearchApiKeyPresent}`);
  console.log(`- SerpAPI key present: ${config.serpApiKeyPresent}`);
  console.log(`- Reddit user agent present: ${config.redditUserAgentPresent}`);
  console.log(`- Reddit client id present: ${config.redditClientIdPresent}`);
  console.log(`- Reddit client secret present: ${config.redditClientSecretPresent}`);
  console.log(`- Runtime: ${config.runtime}`);

  for (const source of VALID_REVIEW_SOURCES) {
    const sourceRows = dataset.filter((review) => review.source === source);
    const filters: ReviewFilters = { sources: [source], startDate, endDate };
    const fallbackFiltered = filterReviews(sourceRows, filters);
    let liveCount = 0;
    let adapter: SourceAdapterDiagnostics | undefined;
    let reason = readinessReason(source);

    try {
      const result = await runScraping([source], new Date(startDate), new Date(endDate));
      liveCount = result.reviews.length;
      adapter = result.adapterDiagnostics?.[0];
      reason = adapter?.finalReason || result.errors[0]?.message || (liveCount > 0 ? "live_fetch_succeeded" : reason);
    } catch (err) {
      reason = err instanceof Error ? err.message : String(err);
    }

    const fallbackUsed = liveCount < 10;
    const finalCount = fallbackUsed ? liveCount + fallbackFiltered.length : liveCount;
    console.log(
      [
        source,
        `fetcherType=${getFetcherType(source)}`,
        `apiAttempted=${adapter?.apiAttempted ?? false}`,
        `status=${adapter?.apiStatusCode ?? "n/a"}`,
        `raw=${adapter?.rawResultCount ?? 0}`,
        `normalized=${adapter?.normalizedResultCount ?? liveCount}`,
        `live=${liveCount}`,
        `fallback=${fallbackUsed ? fallbackFiltered.length : 0}`,
        `final=${finalCount}`,
        `fallbackUsed=${fallbackUsed}`,
        `reason=${reason}`,
        `queries=${adapter?.queriesAttempted?.length ?? 0}`,
        `sourceFiltered=${adapter?.sourceFilteredCount ?? adapter?.normalizedResultCount ?? 0}`,
        `datesInferred=${adapter?.dateInferredCount ?? 0}`,
        `datesDropped=${adapter?.dateDroppedCount ?? 0}`,
        `afterDate=${adapter?.finalAfterDateFilterCount ?? liveCount}`,
        `errorType=${adapter?.apiErrorType ?? "none"}`,
        `shape=${adapter?.rawResponseShape ?? "n/a"}`,
      ].join(" | ")
    );
  }

  const filteredAll = filterReviews(dataset, {
    sources: VALID_REVIEW_SOURCES,
    startDate,
    endDate,
  });

  console.log(`fallback_total=${filteredAll.length}`);
}

function readinessReason(source: string): string {
  if (source === "google_play") return "live_no_auth_available";
  if (source === "app_store") return process.env.APP_STORE_APP_ID ? "rss_fetch_configured" : "missing_app_store_app_id";
  if (source === "reddit") {
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) return "reddit_oauth_configured";
    return hasAnyWebKey() ? "reddit_auth_missing_using_web_search" : "reddit_auth_missing_public_fetch_available";
  }
  if (source === "web_news" || source === "quora") {
    if (process.env.WEB_SEARCH_PROVIDER && !hasAnyWebKey()) return "missing_web_search_api_key";
    return hasAnyWebKey() ? "web_search_configured" : "missing_web_search_provider";
  }
  if (source === "twitter_web") {
    return process.env.X_BEARER_TOKEN ? "x_api_configured" : "x_bearer_token_missing_public_no_auth_unavailable";
  }
  return "unknown";
}

function hasAnyWebKey(): boolean {
  return Boolean(
    process.env.WEB_SEARCH_API_KEY ||
      process.env.BRAVE_SEARCH_API_KEY ||
      process.env.TAVILY_API_KEY ||
      process.env.SERPAPI_API_KEY
  );
}
