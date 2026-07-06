# Review Source Collection

The Review Engine uses the strongest available public collection path for each source and falls back source-by-source when live access is limited.

## Sources

- Google Play: live no-auth collection through `google-play-scraper`. Configure `GOOGLE_PLAY_APP_ID` if the package ID changes.
- App Store: live public RSS collection when `APP_STORE_APP_ID` is set. Optional `APP_STORE_COUNTRY` defaults to `IN`.
- Reddit: best live mode uses OAuth client credentials with `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, and `REDDIT_USER_AGENT`. If credentials are missing, the engine tries lightweight public JSON search before fallback-assisted mode.
- Web / News: live mode needs a configured search provider. Supported keys: `BRAVE_SEARCH_API_KEY`, `TAVILY_API_KEY`, `SERPAPI_API_KEY`, or `WEB_SEARCH_PROVIDER` plus `WEB_SEARCH_API_KEY`. If a provider is set without a key, diagnostics report `missing_web_search_api_key`.
- Quora / Community: treated as public community/forum discovery. Uses the same search provider configuration as Web / News with Quora-targeted queries.
- Twitter / X: live mode requires `X_BEARER_TOKEN`. Without it, X remains fallback-only because public no-auth collection is not reliable.

## Reliability

Every run returns `sourceDiagnostics` for each selected source, including live counts, fallback counts, final counts used, and reason codes such as `missing_app_store_app_id`, `reddit_auth_missing_or_public_fetch_limited`, `missing_web_search_provider`, or `x_bearer_token_missing_public_no_auth_unavailable`.

Fallback-assisted mode keeps the workflow usable, but the diagnostics make it clear which sources were live and which needed credentials or source-level reliable data.
