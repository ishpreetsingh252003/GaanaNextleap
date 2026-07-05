import Groq from "groq-sdk";
import { Review } from "../types/review";
import { MusicCatalogTrack } from "./musicCatalogService";
import { compactReviewForGroq } from "./analysisService";

/**
 * GroqService
 *
 * Wraps the Groq SDK for two core AI flows:
 *   1. analyzeReviews  – batch sentiment / theme extraction from cleaned reviews
 *   2. generateRecommendations – contextual Indian music discovery from user preferences
 *
 * Features:
 *  - Singleton-style access via getGroqService()
 *  - Exponential backoff retry (3 attempts) for 429 / 5xx / timeout
 *  - Token-usage logging
 *  - Graceful JSON parse fallback
 *  - Caller should wrap with fallback logic when this throws
 */
class GroqService {
  private client: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      console.warn("[GroqService] GROQ_API_KEY is not configured.");
    } else {
      this.client = new Groq({ apiKey });
    }
  }

  private getClient(): Groq {
    if (!this.client) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey || apiKey === "your_groq_api_key_here") {
        throw new Error("GROQ_API_KEY is missing. Please configure it in your backend .env file.");
      }
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    operationName = "groq_operation"
  ): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        const result = await operation();
        console.log(`[GroqService] ${operationName} completed in ${Date.now() - startTime}ms`);
        return result;
      } catch (err: any) {
        lastErr = err;
        const isRetryable =
          err?.status === 429 || err?.status >= 500 || err?.code === "ECONNABORTED";
        if (isRetryable && attempt < maxRetries) {
          const wait = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(
            `[GroqService] Retry ${attempt + 1}/${maxRetries} for ${operationName} in ${Math.round(wait)}ms`
          );
          await new Promise((r) => setTimeout(r, wait));
        } else {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  private logTokenUsage(response: any, model: string): void {
    const usage = response?.usage;
    if (usage) {
      console.log(
        `[GroqService] ${model} — prompt: ${usage.prompt_tokens ?? "N/A"} tokens, ` +
          `completion: ${usage.completion_tokens ?? "N/A"} tokens, ` +
          `total: ${usage.total_tokens ?? "N/A"} tokens`
      );
    }
  }

  private parseJsonObject(content: string): any {
    const cleaned = content
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // analyzeReviews
  // ─────────────────────────────────────────────────────────────────────────

  async analyzeReviews(reviews: Review[]): Promise<any> {
    const client = this.getClient();

    if (!reviews || reviews.length === 0) {
      throw new Error("No reviews provided for analysis.");
    }

    const MAX = 30;
    const subset = reviews.slice(0, MAX);

    const reviewText = subset
      .map(
        (r, i) => `[Review ${i + 1}]
Source: ${r.source}
Rating: ${r.rating !== null ? r.rating + "/5" : "N/A"}
Title: ${r.title || "Untitled"}
Content: ${r.text}`
      )
      .join("\n\n");

    const prompt = `You are a senior music streaming product researcher specialising in Indian music apps.

Analyse the following user reviews for a Gaana-style Indian music streaming app and extract structured insights.

${reviewText}

Return a JSON object with EXACTLY this structure (no extra keys, no text outside the JSON):

{
  "summary": "2-3 sentence overview of the dominant user sentiment and top frustrations found in these reviews.",
  "total_reviews_analyzed": ${subset.length},
  "themes": [
    {
      "theme_name": "Concise name (e.g., Repetitive Recommendations, Regional Discovery Gap)",
      "count": 42,
      "description": "What users are specifically reporting about this theme.",
      "pain_point": "The concrete friction or negative impact on the user experience.",
      "representative_quotes": [
        "Exact or close-paraphrase of a quote from the reviews",
        "Another distinct quote",
        "A third quote"
      ],
      "opportunity": "Specific product improvement or feature that would address this pain point."
    }
  ],
  "sentiment_summary": {
    "positive": 15,
    "neutral": 35,
    "negative": 50
  },
  "target_user_segment": "Description of the primary user persona experiencing these problems.",
  "problem_statement": "Clear 2-3 sentence problem statement suitable for a product brief.",
  "business_opportunity": "How addressing these pain points creates measurable value for the streaming platform."
}

Rules:
- Extract 3-5 themes maximum
- sentiment_summary values must be integers summing to exactly 100
- representative_quotes should reflect actual content from the reviews provided
- problem_statement must be specific to the data, not generic
- Return ONLY the JSON object — no preamble, no commentary`;

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 3500,
      });

      this.logTokenUsage(response, "llama-3.3-70b-versatile");

      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq API.");

      try {
        return JSON.parse(content);
      } catch {
        console.error("[GroqService] JSON parse failed in analyzeReviews");
        throw new Error("Groq returned malformed JSON — fallback will be used.");
      }
    }, 3, "analyzeReviews");
  }

  async discoverReviewThemes(
    reviews: Review[],
    context: { chunkIndex: number; totalChunks: number; totalReviews: number }
  ): Promise<any> {
    const client = this.getClient();
    const compactReviews = reviews.map(compactReviewForGroq);

    const prompt = `You are Stage A of a review discovery engine for an Indian music streaming app.

Use only the supplied compact feedback snippets. Discover repeated music-discovery themes without inventing evidence.

CONTEXT:
- Chunk: ${context.chunkIndex + 1} of ${context.totalChunks}
- Total matched feedback entries: ${context.totalReviews}

REVIEWS:
${JSON.stringify(compactReviews)}

Return JSON only:
{
  "themes": [
    {
      "label": "",
      "description": "",
      "supportingReviewIds": []
    }
  ],
  "painPoints": [],
  "segmentInsights": [],
  "unmetNeeds": []
}

Rules:
- Max 5 themes.
- supportingReviewIds must be review_id values from the supplied reviews.
- No markdown.
- No text outside JSON.`;

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 1800,
      });

      this.logTokenUsage(response, "llama-3.3-70b-versatile");
      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq API.");

      let parsed: any;
      try {
        parsed = this.parseJsonObject(content);
      } catch {
        const err: any = new Error("Stage A returned malformed JSON.");
        err.status = 500;
        throw err;
      }
      if (!Array.isArray(parsed.themes)) throw new Error("Stage A returned invalid themes.");
      parsed.themes = parsed.themes.slice(0, 5);
      return parsed;
    }, 1, "discoverReviewThemes");
  }

  async synthesizeReviewInsights(
    stageOutputs: any[],
    evidenceReviews: Review[],
    metadata: {
      totalReviews: number;
      sourcesUsed: string[];
      requestedDateRange: { startDate: string | null; endDate: string | null };
      repair?: boolean;
    }
  ): Promise<any> {
    const client = this.getClient();
    const evidence = evidenceReviews.slice(0, 24).map(compactReviewForGroq);

    const prompt = `You are Stage B of a review discovery engine for an Indian music streaming app.

Synthesize final product insights from Stage A themes and supplied evidence. Use only the supplied evidence.
${metadata.repair ? "This is a repair pass: return complete valid JSON with all required fields." : ""}

METADATA:
${JSON.stringify({
  totalReviews: metadata.totalReviews,
  sourcesUsed: metadata.sourcesUsed,
  requestedDateRange: metadata.requestedDateRange,
})}

STAGE_A_OUTPUTS:
${JSON.stringify(stageOutputs)}

SUPPORTING_EVIDENCE:
${JSON.stringify(evidence)}

Return JSON only:
{
  "summary": "",
  "total_reviews_analyzed": ${metadata.totalReviews},
  "themes": [
    {
      "theme_name": "",
      "count": 0,
      "description": "",
      "pain_point": "",
      "representative_quotes": [],
      "opportunity": ""
    }
  ],
  "sentiment_summary": { "positive": 0, "neutral": 0, "negative": 0 },
  "target_user_segment": "",
  "problem_statement": "",
  "business_opportunity": "",
  "quotes": [],
  "segmentInsights": [],
  "unmetNeeds": []
}

Rules:
- Max 5 themes.
- Quotes must be copied from supplied snippets only.
- No PII.
- No markdown.
- No text outside JSON.`;

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 2500,
      });

      this.logTokenUsage(response, "llama-3.3-70b-versatile");
      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq API.");

      let parsed: any;
      try {
        parsed = this.parseJsonObject(content);
      } catch {
        const err: any = new Error("Stage B returned malformed JSON.");
        err.status = 500;
        throw err;
      }
      if (!Array.isArray(parsed.themes)) throw new Error("Stage B returned invalid themes.");
      parsed.themes = parsed.themes.slice(0, 5);
      return parsed;
    }, 1, metadata.repair ? "synthesizeReviewInsightsRepair" : "synthesizeReviewInsights");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // generateRecommendations
  // ─────────────────────────────────────────────────────────────────────────

  async generateRecommendations(preferences: {
    query?: string;
    mood: string;
    language: string;
    activity: string;
    freshness: string;
    reference?: string;
    avoid: string[];
    refineAction?: string;
  }): Promise<any> {
    const client = this.getClient();
    const { query, mood, language, activity, freshness, reference, avoid, refineAction } = preferences;

    // Translate avoid codes to natural language for the prompt
    const avoidDescriptions: Record<string, string> = {
      avoid_repeated_artists: "do not repeat the same artist more than once",
      avoid_mainstream: "avoid mainstream viral hits and chart-toppers — prefer lesser-known tracks",
      avoid_overplayed: "avoid overplayed tracks that dominate streaming charts",
      avoid_sad: "avoid sad or melancholic songs",
      avoid_slow: "avoid slow-tempo songs",
    };
    const avoidText = avoid.length > 0
      ? avoid.map((a) => avoidDescriptions[a] || a).join("; ")
      : "none";

    // Freshness guidance
    const freshnessGuide: Record<string, string> = {
      Safe: "Prioritise popular, well-known hits that the user is likely familiar with. Safe and recognisable.",
      Balanced: "Mix familiar hits with some newer or emerging tracks. Roughly 50/50 between popular and fresh.",
      Fresh: "Heavily favour newer releases, emerging artists, and underrated gems. Minimise overplayed chart hits.",
    };

    const prompt = `You are an expert Indian music curator for a Gaana-style streaming platform.

Generate exactly 8-10 personalised music recommendations based on the user's preferences.

USER PREFERENCES:
- Open-ended discovery query: ${query || reference || "No free-text query provided"}
- Mood: ${mood}
- Language: ${language} (prioritise this language; include cross-language only if it perfectly fits)
- Activity context: ${activity}
- Freshness level: ${freshness} — ${freshnessGuide[freshness]}
${reference ? `- Reference artist/song: ${reference} (find similar vibe but NOT the same tracks)` : ""}
- Refinement action: ${refineAction || "none"}
- Avoid preferences: ${avoidText}

IMPORTANT RULES:
1. Focus on Indian music (Bollywood, Punjabi, Tamil, Telugu, Bhojpuri, Indie India) unless English is specified
2. Each recommendation must have SPECIFIC reasoning — never use generic phrases like "this is a great song"
3. Match the activity energy: Gym = high BPM, Studying = instrumental or low distraction, Late night = atmospheric
4. Respect freshness: Fresh = underrated/new/emerging, Safe = popular/familiar, Balanced = mix
5. If reference is provided, draw on style/mood similarities but offer distinct songs and artists
6. Do NOT claim access to Gaana's internal catalog — use publicly known music knowledge
7. Freshness label must be exactly: "Safe", "Balanced", or "Fresh"
8. Return ONLY a valid JSON object — no text before or after

Return this EXACT JSON structure:
{
  "recommendations": [
    {
      "title": "Song Name",
      "artist_or_type": "Artist Name",
      "language_mood_fit": "Why this specific ${language} track fits the ${mood} mood and ${activity} context",
      "why_this_fits": "Specific reasoning: tempo, energy level, lyrical theme, or cultural connection to the preference",
      "how_fresh_this_is": "New release (year) / Emerging artist / Underrated regional gem / Popular hit since (year)",
      "freshness_label": "Safe" | "Balanced" | "Fresh",
      "avoids_repeating": "What this track avoids relative to the user's avoid preferences"
    }
  ],
  "explanation": "2-3 sentence summary of the discovery approach taken for this query.",
  "query_used": "Natural language echo of the user's request for confirmation"
}`;

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        response_format: { type: "json_object" },
        max_tokens: 3500,
      });

      this.logTokenUsage(response, "llama-3.3-70b-versatile");

      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq API.");

      let result: any;
      try {
        result = JSON.parse(content);
      } catch {
        console.error("[GroqService] JSON parse failed in generateRecommendations");
        throw new Error("Groq returned malformed JSON — fallback will be used.");
      }

      if (!result.recommendations || !Array.isArray(result.recommendations)) {
        result.recommendations = [];
      }

      // Validate freshness_label values
      result.recommendations = result.recommendations.map((r: any) => ({
        ...r,
        freshness_label: ["Safe", "Balanced", "Fresh"].includes(r.freshness_label)
          ? r.freshness_label
          : "Balanced",
      }));

      if (result.recommendations.length < 8) {
        console.warn(`[GroqService] Only ${result.recommendations.length} recommendations returned — fallback may be needed`);
      }

      return result;
    }, 3, "generateRecommendations");
  }

  async explainCatalogMatches(
    tracks: MusicCatalogTrack[],
    preferences: {
      query?: string;
      mood: string;
      language: string;
      activity: string;
      freshness: string;
      reference?: string;
      avoid: string[];
      refineAction?: string;
    }
  ): Promise<any> {
    const client = this.getClient();
    const compactTracks = tracks.slice(0, 10).map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
    }));

    const prompt = `You are helping explain public music metadata matches for an Indian music discovery MVP.

Use ONLY these catalog tracks. Do not invent tracks, playback, or catalog availability.

USER CONTEXT:
- Query/reference: ${preferences.query || preferences.reference || "none"}
- Mood: ${preferences.mood}
- Language: ${preferences.language}
- Activity: ${preferences.activity}
- Freshness: ${preferences.freshness}
- Avoid: ${preferences.avoid.join(", ") || "none"}
- Refine action: ${preferences.refineAction || "none"}

CATALOG TRACKS:
${JSON.stringify(compactTracks)}

Return only JSON:
{
  "explanation": "One short sentence about the discovery approach.",
  "matches": [
    {
      "id": "same id from catalog",
      "why_this_fits": "One sentence grounded in the query/reference.",
      "best_for": "Short use case such as familiar anchor, fresh alternative, late-night discovery.",
      "freshness_label": "Safe" | "Balanced" | "Fresh"
    }
  ]
}`;

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      this.logTokenUsage(response, "llama-3.3-70b-versatile");

      const content = response.choices[0].message.content;
      if (!content) throw new Error("Empty response from Groq API.");

      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.matches)) parsed.matches = [];
      return parsed;
    }, 1, "explainCatalogMatches");
  }
}

export { GroqService };
let instance: GroqService | null = null;

export default function getGroqService(): GroqService {
  if (!instance) {
    instance = new GroqService();
  }
  return instance;
}
