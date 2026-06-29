"use client";

/**
 * /discovery – Discovery Agent page (Phase 4 will add the full recommendation engine)
 * Phase 1 scaffold: displays the page shell with preference form placeholders.
 */
import Link from "next/link";

const MOODS = ["Chill", "Sad", "Party", "Gym", "Travel", "Focus", "Romantic", "Energetic"];
const LANGUAGES = ["Hindi", "Punjabi", "Tamil", "Telugu", "Bhojpuri", "English", "Mixed"];
const ACTIVITIES = ["Studying", "Travelling", "Gym", "Late night", "Party", "Work", "Relaxing"];
const FRESHNESS = ["Safe", "Balanced", "Fresh"] as const;

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🎵 Gaana Discovery AI
        </Link>
        <nav className="flex gap-6 text-sm text-white/80">
          <Link href="/reviews" className="hover:text-white transition-colors">
            Reviews
          </Link>
          <Link href="/discovery" className="text-white font-semibold">
            Discovery
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </nav>
      </header>

      {/* ── Content ── */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-green-600 bg-green-100 px-3 py-1 rounded-full">
            Phase 4 – Coming Soon
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Discovery Agent</h1>
          <p className="text-gray-500">
            Tell the AI your mood, language, and vibe to get fresh music picks
            tailored just for you. Full functionality arrives in Phase 4.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Mood */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Mood</legend>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  disabled
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
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
                  disabled
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Activity */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Activity</legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a}
                  disabled
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Freshness */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Freshness</legend>
            <div className="flex gap-4">
              {FRESHNESS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm text-gray-400 cursor-not-allowed">
                  <input type="radio" name="freshness" disabled className="accent-green-500" />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Reference */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Reference (artist, song, or describe your vibe)
            </label>
            <textarea
              rows={2}
              disabled
              placeholder="e.g. something like Arijit Singh but more upbeat…"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed resize-none"
            />
          </div>

          <button
            disabled
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold opacity-40 cursor-not-allowed"
          >
            Discover Music (Available in Phase 4)
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/reviews" className="text-purple-600 hover:underline">
            ← Analyse reviews first
          </Link>
        </p>
      </main>
    </div>
  );
}
