"use client";

/**
 * /discovery – Discovery Agent (Phase 4).
 * Fully functional AI-powered music discovery interface.
 */
import Link from "next/link";
import { useState } from "react";

const MOODS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const LANGUAGES = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const ACTIVITIES = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const FRESHNESS = ["Safe", "Balanced", "Fresh"] as const;
const AVOID_OPTIONS = [
  { label: "Avoid repeated artists", value: "avoid_repeated_artists" },
  { label: "Avoid mainstream", value: "avoid_mainstream" },
  { label: "Avoid overplayed", value: "avoid_overplayed" },
  { label: "Avoid sad", value: "avoid_sad" },
  { label: "Avoid slow", value: "avoid_slow" },
];

interface Recommendation {
  title: string;
  artist_or_type: string;
  language_mood_fit: string;
  why_this_fits: string;
  how_fresh_this_is: string;
  freshness_label: "Safe" | "Balanced" | "Fresh";
  avoids_repeating: string;
}

interface DiscoveryResponse {
  recommendations: Recommendation[];
  explanation: string;
  query_used: string;
}

export default function DiscoveryPage() {
  const [mood, setMood] = useState<string>("");
  const [language, setLanguage] = useState<string>("Hindi");
  const [activity, setActivity] = useState<string>("");
  const [freshness, setFreshness] = useState<"Safe" | "Balanced" | "Fresh">("Balanced");
  const [reference, setReference] = useState<string>("");
  const [avoid, setAvoid] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<DiscoveryResponse | null>(null);
  const [lastQuery, setLastQuery] = useState<any>(null);

  const toggleAvoid = (value: string) => {
    setAvoid((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleDiscover = async () => {
    if (!mood || !activity) {
      setError("Please select at least a mood and activity.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    const query = { mood, language, activity, freshness, reference, avoid };
    setLastQuery(query);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendUrl}/api/discovery-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_message || "Failed to generate recommendations");
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!lastQuery) return;

    setLoading(true);
    setError("");

    let modifiedQuery = { ...lastQuery };

    switch (action) {
      case "more_fresh":
        modifiedQuery.freshness = "Fresh";
        break;
      case "more_familiar":
        modifiedQuery.freshness = "Safe";
        break;
      case "more_regional":
        modifiedQuery.language = language === "English" ? "Hindi" : language;
        break;
      case "avoid_mainstream":
        if (!modifiedQuery.avoid.includes("avoid_mainstream")) {
          modifiedQuery.avoid = [...modifiedQuery.avoid, "avoid_mainstream"];
        }
        break;
      default:
        break;
    }

    setLastQuery(modifiedQuery);
    setMood(modifiedQuery.mood);
    setLanguage(modifiedQuery.language);
    setActivity(modifiedQuery.activity);
    setFreshness(modifiedQuery.freshness);
    setReference(modifiedQuery.reference || "");
    setAvoid(modifiedQuery.avoid);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendUrl}/api/discovery-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modifiedQuery),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_message || "Failed to generate recommendations");
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
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
            Phase 4 – AI-Powered Discovery
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Discovery Agent</h1>
          <p className="text-gray-500">
            Tell the AI your mood, language, and vibe — get fresh,
            contextually relevant music picks.
          </p>
        </div>

        {!results ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            {/* Mood */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Mood *</legend>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                      mood === m
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-200 text-gray-700 hover:border-green-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Language */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Language</legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                      language === l
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-200 text-gray-700 hover:border-green-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Activity */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Activity *</legend>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setActivity(a)}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                      activity === a
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-200 text-gray-700 hover:border-green-400"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Freshness */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Freshness</legend>
              <div className="flex gap-6">
                {FRESHNESS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={freshness === f}
                      onChange={() => setFreshness(f)}
                      className="accent-green-500"
                    />{" "}
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Avoid */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Avoid Preferences</legend>
              <div className="space-y-1.5">
                {AVOID_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avoid.includes(o.value)}
                      onChange={() => toggleAvoid(o.value)}
                      className="accent-green-500"
                    />{" "}
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Reference */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reference artist, song, or describe your vibe (optional)
              </label>
              <textarea
                rows={2}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. something like Arijit Singh but more upbeat…"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleDiscover}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "🎵 Discovering..." : "🎵 Discover Music"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Your Recommendations</h2>
                <button
                  onClick={() => setResults(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Start Over
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">{results.explanation}</p>
              <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500">
                <strong>Query:</strong> {results.query_used}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid gap-4">
              {results.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{rec.title}</h3>
                      <p className="text-sm text-gray-500">{rec.artist_or_type}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        rec.freshness_label === "Fresh"
                          ? "bg-green-100 text-green-700"
                          : rec.freshness_label === "Balanced"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {rec.freshness_label}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Why this fits:</span>
                      <p className="text-gray-600">{rec.why_this_fits}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Language & Mood:</span>
                      <p className="text-gray-600">{rec.language_mood_fit}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>🆕 {rec.how_fresh_this_is}</span>
                      <span>🔄 {rec.avoids_repeating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAction("more_fresh")}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Fresh
                </button>
                <button
                  onClick={() => handleQuickAction("more_familiar")}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Familiar
                </button>
                <button
                  onClick={() => handleQuickAction("more_regional")}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  More Regional
                </button>
                <button
                  onClick={() => handleQuickAction("avoid_mainstream")}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Avoid Mainstream
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/reviews" className="text-purple-600 hover:underline">← Scrape reviews first</Link>
        </p>
      </main>
    </div>
  );
}
