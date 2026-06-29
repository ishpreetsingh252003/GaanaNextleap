"use client";

/**
 * /discovery – Discovery Agent scaffold (Phase 4).
 * Shows the full preference UI in read-only preview state.
 */
import Link from "next/link";

const MOODS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const LANGUAGES = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const ACTIVITIES = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const FRESHNESS = ["Safe", "Balanced", "Fresh"] as const;
const AVOID_OPTIONS = [
  "Avoid repeated artists",
  "Avoid mainstream",
  "Avoid overplayed",
  "Avoid sad",
  "Avoid slow",
];

export default function DiscoveryPage() {
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

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 bg-green-100 px-3 py-1 rounded-full">
            Phase 4 – Coming Soon
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Discovery Agent</h1>
          <p className="text-gray-500">
            Tell the AI your mood, language, and vibe — get fresh,
            contextually relevant music picks. Full engine arrives in Phase 4.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Mood */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Mood</legend>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button key={m} disabled className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed">{m}</button>
              ))}
            </div>
          </fieldset>

          {/* Language */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Language</legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l} disabled className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed">{l}</button>
              ))}
            </div>
          </fieldset>

          {/* Activity */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Activity</legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button key={a} disabled className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed">{a}</button>
              ))}
            </div>
          </fieldset>

          {/* Freshness */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Freshness</legend>
            <div className="flex gap-6">
              {FRESHNESS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
                  <input type="radio" disabled className="accent-green-500" /> {f}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Avoid */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Avoid Preferences</legend>
            <div className="space-y-1.5">
              {AVOID_OPTIONS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
                  <input type="checkbox" disabled className="accent-green-500" /> {o}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Reference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reference artist, song, or describe your vibe
            </label>
            <textarea
              rows={2}
              disabled
              placeholder="e.g. something like Arijit Singh but more upbeat…"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed resize-none"
            />
          </div>

          <button disabled className="w-full bg-green-600 text-white py-3 rounded-xl font-bold opacity-40 cursor-not-allowed">
            🎵 Discover Music (Available in Phase 4)
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/reviews" className="text-purple-600 hover:underline">← Scrape reviews first</Link>
        </p>
      </main>
    </div>
  );
}
