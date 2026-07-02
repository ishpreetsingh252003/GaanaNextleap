import Groq from "groq-sdk";
import { Review } from "../types/review";

/**
 * GroqService
 *
 * Wraps the Groq SDK for two core AI flows:
 *   1. `analyzeReviews` – batch sentiment / theme extraction from cleaned reviews.
 *   2. `generateRecommendations` – contextual music recommendations from user preferences.
 *
 * Features:
 *  - Singleton-style access via `getGroqService()`.
 *  - Automatic retry with exponential backoff for transient errors (429 / 5xx / aborted).
 *  - Token-usage logging for cost monitoring.
 *  - Graceful JSON.parse fallback when the model returns non-JSON content.
 */
class GroqService {
  private client: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      console.warn("[GroqService] Warning: GROQ_API_KEY is not configured or is the default placeholder.");
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
        const duration = Date.now() - startTime;
        console.log(`[GroqService] ${operationName} completed in ${duration}ms`);
        return result;
      } catch (err: any) {
        lastErr = err;
        const isRetryable =
          err?.status === 429 ||
          err?.status >= 500 ||
          err?.code === "ECONNABORTED";

        if (isRetryable && attempt < maxRetries) {
          const wait = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(
            `[GroqService] Retry ${attempt + 1}/${maxRetries} for ${operationName} in ${Math.round(wait)}ms`
          );
          await this.sleep(wait);
        } else {
          throw err;
        }
      }
    }
    throw lastErr;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private logTokenUsage(response: any, model: string): void {
    const usage = response?.usage;
    if (usage) {
      console.log(
        `[GroqService] Token usage - Model: ${model}, ` +
          `Prompt: ${usage.prompt_tokens || "N/A"}, ` +
          `Completion: ${usage.completion_tokens || "N/A"}, ` +
          `Total: ${usage.total_tokens || "N/A"}`
      );
    }
  }

  /**
   * Analyze an array of cleaned reviews and return structured AI insights.
   * @param reviews Array of Review objects (cleaned). Capped at 100 for context limits.
   * @returns Parsed JSON with themes, sentiment, problem statement, etc.
   */
  async analyzeReviews(reviews: Review[]): Promise<any> {
    const client = this.getClient();

    if (!reviews || reviews.length === 0) {
      throw new Error("No reviews provided for analysis.");
    }

    const maxReviewsToAnalyze = 100;
    const subset = reviews.slice(0, maxReviewsToAnalyze);

    const reviewText = subset
      .map((r, i) => `[Review ${i + 1}]
Source: ${r.source}
Rating: ${r.rating !== null ? r.rating + "/5" : "N/A"}
Title: ${r.title || "Untitled"}
Content: ${r.text}`)
      .join("\n\n");

    const prompt = `You are a music streaming product researcher. Analyze the following user reviews for the Gaana music app and extract key themes, sentiment statistics, and opportunity areas.

${reviewText}

Provide a JSON object response with the following exact structure:
{
  "summary": "Overall summary of the findings and app state in 2-3 sentences.",
  "total_reviews_analyzed": ${subset.length},
  "themes": [
    {
      "theme_name": "Short Name of Theme (e.g., Audio Ads Intrusion)",
      "count": 45,
      "description": "Explanation of what users are reporting about this theme.",
      "pain_point": "The user friction / negative impact.",
      "representative_quotes": ["Real quote 1", "Real quote 2", "Real quote 3"],
      "opportunity": "How Gaana can address this theme to build a premium experience."
    }
  ],
  "sentiment_summary": {
    "positive": 15,
    "neutral": 40,
    "negative": 45
  },
  "target_user_segment": "Description of the primary user segment experiencing these issues.",
  "problem_statement": "A clear, concise, 2-3 sentence problem statement explaining the current user frustration.",
  "business_opportunity": "Detailed description of the business value and features that would address the pain points."
}

Format your response as a valid JSON object. Ensure the "sentiment_summary" values are integers that add up to 100.
Do not include any introductory or concluding text outside the JSON object itself.`;

    try {
      return await this.withRetry(async () => {
        const response = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 3000,
        });

        this.logTokenUsage(response, "llama-3.3-70b-versatile");

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("Received empty response content from Groq API.");
        }

        try {
          return JSON.parse(content);
        } catch (parseErr) {
          console.error("[GroqService] JSON parse error, returning raw content:", content);
          return {
            summary: "Analysis completed but returned invalid JSON. Raw response provided.",
            raw_response: content,
            _parse_error: true,
          };
        }
      }, 3, "analyzeReviews");
    } catch (err) {
      console.error("[GroqService] Error running review analysis:", err);
      throw err;
    }
  }

  /**
   * Generate 8-10 personalized music recommendations from user preferences.
   * @param preferences Mood, language, activity, freshness, optional reference, avoid list.
   * @returns Parsed JSON with recommendations array and explanation.
   */
  async generateRecommendations(preferences: {
    mood: string;
    language: string;
    activity: string;
    freshness: string;
    reference?: string;
    avoid: string[];
  }): Promise<any> {
    const client = this.getClient();

    const { mood, language, activity, freshness, reference, avoid } = preferences;

    const prompt = `You are an expert music curator for Indian music streaming. Generate 8-10 music recommendations based on the user's preferences.

User Preferences:
- Mood: ${mood}
- Language: ${language}
- Activity: ${activity}
- Freshness Preference: ${freshness} (Safe = familiar hits, Balanced = mix of hits and new, Fresh = mostly new/emerging)
${reference ? `- Reference: ${reference}` : ''}
${avoid.length > 0 ? `- Avoid: ${avoid.join(", ")}` : ''}

Generate recommendations as a JSON array with this exact structure:
{
  "recommendations": [
    {
      "title": "Song Name",
      "artist_or_type": "Artist Name / Playlist Type",
      "language_mood_fit": "Why this fits the language and mood preference",
      "why_this_fits": "Specific reasoning based on user's activity and preferences",
      "how_fresh_this_is": "New release / Emerging artist / Underrated gem / Popular hit",
      "freshness_label": "Safe" | "Balanced" | "Fresh",
      "avoids_repeating": "How this avoids repetition or mainstream overexposure"
    }
  ],
  "explanation": "Overall discovery approach summary in 2-3 sentences",
  "query_used": "Echo of user's input for confirmation"
}

Guidelines:
- Prioritize the specified language (${language}) but include cross-language fits if they match the mood
- Match the activity context (e.g., gym = energetic, studying = focus, relaxing = chill)
- Respect freshness: "Safe" = popular hits, "Balanced" = mix, "Fresh" = new/emerging artists
- If reference is provided, find similar artists/songs but not the same ones
- Avoid mainstream overplayed songs if user selected "Avoid mainstream"
- Focus on Indian music scene (Bollywood, regional, indie) unless English is specified
- Each recommendation must have specific, non-generic reasoning

Format your response as valid JSON. Do not include any text outside the JSON object.`;

    try {
      return await this.withRetry(async () => {
        const response = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          response_format: { type: "json_object" },
          max_tokens: 3500,
        });

        this.logTokenUsage(response, "llama-3.3-70b-versatile");

        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("Received empty response content from Groq API.");
        }

        let result: any;
        try {
          result = JSON.parse(content);
        } catch (parseErr) {
          console.error("[GroqService] JSON parse error, returning raw content:", content);
          result = {
            recommendations: [],
            explanation: "Failed to parse response. Please try again.",
            raw_response: content,
          };
        }

        if (!result.recommendations || !Array.isArray(result.recommendations)) {
          result.recommendations = [];
        }

        if (result.recommendations.length < 8) {
          console.warn("[GroqService] Received fewer than 8 recommendations");
        }

        return result;
      }, 3, "generateRecommendations");
    } catch (err) {
      console.error("[GroqService] Error generating recommendations:", err);
      throw err;
    }
  }
}

export { GroqService };
let instance: GroqService | null = null;

/**
 * Returns the singleton GroqService instance.
 */
export default function getGroqService(): GroqService {
  if (!instance) {
    instance = new GroqService();
  }
  return instance;
}
