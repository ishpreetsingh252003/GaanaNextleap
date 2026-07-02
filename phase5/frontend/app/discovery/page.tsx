"use client";

import Link from "next/link";
import { useState } from "react";
import { generateRecommendations, DiscoveryPreferences, DiscoveryResponse, BackendError } from "../../lib/api";

// Aligned with backend routes/discovery.ts VALID_* enums
const MOOD_OPTIONS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const LANGUAGE_OPTIONS = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const ACTIVITY_OPTIONS = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const FRESHNESS_OPTIONS = ["Safe", "Balanced", "Fresh"];

const AVOID_OPTIONS = [
  { value: "avoid_repeated_artists", label: "Avoid repeated artists" },
  { value: "avoid_mainstream", label: "Avoid mainstream / viral hits" },
  { value: "avoid_overplayed", label: "Avoid overplayed tracks" },
  { value: "avoid_sad", label: "Avoid sad / melancholic tracks" },
  { value: "avoid_slow", label: "Avoid slow tempo songs" },
];

type Status = "idle" | "loading" | "success" | "error";

export default function DiscoveryPage() {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("");
  const [activity, setActivity] = useState("");
  const [freshness, setFreshness] = useState("");
  const [reference, setReference] = useState("");
  const [avoidList, setAvoidList] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DiscoveryResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function toggleAvoid(value: string) {
    setAvoidList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function prefillDemo() {
    setMood("Gym");
    setLanguage("Punjabi");
    setActivity("Gym");
    setFreshness("Fresh");
    setReference("Sidhu Moose Wala");
    setAvoidList(["avoid_repeated_artists", "avoid_overplayed"]);
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
      const message = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Failed to generate recommendations";
      setErrorMsg(message);
      setStatus("error");
    }
  }

  const freshnessColor = (label: string) => {
    if (label === "Fresh") return "bg-green-100 text-green-700";
    if (label === "Balanced") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow" role="banner">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80" role="navigation" aria-label="Main navigation">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="text-white font-semibold border-b border-white" aria-current="page">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Music Discovery Agent</h1>
          <p className="text-gray-500">AI-powered personalized recommendations based on your mood, language, and activity preferences.</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={prefillDemo}
            type="button"
            className="inline-flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            🎤 Pre-fill Demo Query
          </button>
          <span className="text-xs text-gray-400 self-center">
            Sets: Punjabi Gym songs like Sidhu Moose Wala — skip overplayed viral tracks
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="mood">
              Mood <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="mood"
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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="language">
              Language <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="language"
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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="activity">
              Activity <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="activity"
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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="freshness">
              Freshness <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="freshness"
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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="reference">
              Reference artist or song (optional)
            </label>
            <input
              id="reference"
              type="text"
              placeholder="e.g., Sidhu Moose Wala, 'Tum Hi Ho' by Arijit Singh"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm md:col-span-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">What to avoid</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {AVOID_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={avoidList.includes(opt.value)}
                    onChange={() => toggleAvoid(opt.value)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-400 accent-purple-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={status === "loading"}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          aria-busy={status === "loading"}
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg" aria-hidden="true">⏳</span>
              Generating recommendations...
            </span>
          ) : (
            "🎵 Generate Recommendations"
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          This MVP uses publicly available metadata and AI inference to demonstrate the discovery experience. It does not represent Gaana&apos;s full internal catalog.
        </p>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6 text-red-700 text-sm" role="alert">
            ⚠️ {errorMsg}
          </div>
        )}

        {status === "success" && result && (
          <div className="mt-8 animate-fade-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2">Recommendations Ready!</h2>
              <p className="text-white/90 text-sm">{result.explanation}</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  setFreshness("Fresh");
                  setTimeout(handleGenerate, 0);
                }}
                type="button"
                className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                🔥 More Fresh
              </button>
              <button
                onClick={() => {
                  const moodCycle = MOOD_OPTIONS[(MOOD_OPTIONS.indexOf(mood || "") + 1) % MOOD_OPTIONS.length];
                  setMood(moodCycle);
                  setTimeout(handleGenerate, 0);
                }}
                type="button"
                className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                🎭 Change Mood
              </button>
              <button
                onClick={() => {
                  if (!avoidList.includes("avoid_mainstream")) {
                    setAvoidList([...avoidList, "avoid_mainstream"]);
                  }
                  setTimeout(handleGenerate, 0);
                }}
                type="button"
                className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                🚫 Avoid Mainstream
              </button>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${freshnessColor(rec.freshness_label)}`} aria-label={`Freshness: ${rec.freshness_label}`}>
                      {rec.freshness_label}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1 font-medium">Why this fits</p>
                      <p className="text-gray-700">{rec.why_this_fits}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1 font-medium">Language &amp; mood fit</p>
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
