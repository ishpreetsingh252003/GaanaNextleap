/** Base URL for all backend API calls. Reads from env or falls back to localhost. */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/** App-level constants */
export const APP_NAME = "Gaana Discovery AI";
export const APP_DESCRIPTION =
  "Discover fresh but relevant music based on your mood, language, activity, and freshness preference.";
export const GOOGLE_PLAY_APP_ID = "com.gaana";
