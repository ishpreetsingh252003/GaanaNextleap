import Groq from "groq-sdk";
import { Review } from "../types/review";

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

  async analyzeReviews(reviews: Review[]): Promise<any> {
    const client = this.getClient();

    if (!reviews || reviews.length === 0) {
      throw new Error("No reviews provided for analysis.");
    }

    // Limit reviews in single call to avoid context token overflow
    // Standard prompt compiles text from up to 100 reviews. Let's take the first 100 reviews.
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
      // Use Llama 3.3 70b since it's the current flagship model for text analysis on Groq,
      // fallback to Mixtral if there are issues.
      const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2, // Low temperature for consistent analysis extraction
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Received empty response content from Groq API.");
      }

      return JSON.parse(content);
    } catch (err) {
      console.error("[GroqService] Error running review analysis:", err);
      throw err;
    }
  }
}

export default new GroqService();
