"use client";

import Link from "next/link";
import { useState } from "react";
import { generateRecommendations, DiscoveryPreferences, DiscoveryResponse } from "../../lib/api";

const MOOD_OPTIONS = [
  "Happy / Uplifting",
  "Sad / Emotional",
  "Relaxed / Chill",
  "Energetic / Workout",
  "Romantic",
  "Focus / Study",
  "Party / Dance",
  "Nostalgic",
];

const LANGUAGE_OPTIONS = [
  "Hindi",
  "Punjabi",
  "English",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Mixed / Any",
];

const ACTIVITY_OPTIONS = [
  "Commute",
  "Work / Study",
  "Workout",
  "Party",
  "Relaxation",
  "Sleep",
  "Social gathering",
  "Driving",
];

const FRESHNESS_OPTIONS = [
  "Trending now (last 3 months)",
  "Recent hits (last 6 months)",
  "All-time classics",
  "Balanced mix",
];

type Status = "idle" | "loading" | "success" | "error";

export default function DiscoveryPage() {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");
  const [activity, setActivity] = useState("");
  const [freshness, setFreshness] = useState("");
  const [reference, setReference] = useState("");
  const [avoidInput, setAvoidInput] = useState("");
  const [avoidList, setAvoidList] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DiscoveryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function addAvoid() {
    const trimmed = avoidInput.trim();
    if (trimmed && !avoidList.includes(trimmed)) {
      setAvoidList([...avoidList, trimmed]);
      setAvoidInput("");
    }
  }

  function removeAvoid(item: string) {
    setAvoidList(avoidList.filter((i) => i !== item));
  }

  async function handleGenerate() {
    if (!mood || !language || !activity || !freshness) {
      setErrorMsg("Please fill in all required fields");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    const preferences: DiscoveryPreferences = {
      mood,
      language,
      activity,
      freshness,
      reference: reference || undefined,
      avoid: avoidList,
    };

    try {
      const data = await generateRecommendations(preferences);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to generate recommendations");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-5 text-sm text-white/80">
          <Link href="/reviews" className="hover:text-white">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="text-white font-semibold border-b border-white">Discovery</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 bg-green-100 px-3 py-1 rounded-full">
            Phase 4 – AI Discovery Agent
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Music Discovery Agent</h1>
          <p className="text-gray-500">
            Get personalized music recommendations based on your mood, language, and activity preferences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mood */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Mood <span className="text-red-500">*</span>
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select mood</option>
              {MOOD_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Language <span className="text-red-500">*</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select language</option>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Activity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Activity <span className="text-red-500">*</span>
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select activity</option>
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Freshness */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Freshness <span className="text-red-500">*</span>
            </label>
            <select
              value={freshness}
              onChange={(e) => setFreshness(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select freshness</option>
              {FRESHNESS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Reference (optional) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Reference song (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 'Tum Hi Ho' by Arijit Singh"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Avoid list */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Artists / genres to avoid
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add artist or genre to avoid..."
                value={avoidInput}
                onChange={(e) => setAvoidInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAvoid()}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={addAvoid}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
            {avoidList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {avoidList.map((item) => (
                  <span
                    key={item}
                    className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      onClick={() => removeAvoid(item)}
                      className="text-red-500 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg"
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Generating recommendations...
            </span>
          ) : (
            "🎵 Generate Recommendations"
          )}
        </button>

        {/* Error */}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6 text-red-700 text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Results */}
        {status === "success" && result && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
              <h2 className="text-xl font-bold mb-2">Recommendations Ready!</h2>
              <p className="text-white/90 text-sm">{result.explanation}</p>
            </div>

            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{rec.title}</h3>
                      <p className="text-sm text-gray-500">{rec.artist_or_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.freshness_label === "Fresh"
                        ? "bg-green-100 text-green-700"
                        : rec.freshness_label === "Balanced"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {rec.freshness_label}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Why this fits</p>
                      <p className="text-gray-700">{rec.why_this_fits}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Language & mood fit</p>
                      <p className="text-gray-700">{rec.language_mood_fit}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                    <p className="text-gray-500">
                      <span className="font-medium">Freshness:</span> {rec.how_fresh_this_is}
                    </p>
                    {rec.avoids_repeating && (
                      <p className="text-gray-500 mt-1">
                        <span className="font-medium">Avoids:</span> {rec.avoids_repeating}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
