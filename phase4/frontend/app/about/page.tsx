"use client";

import Link from "next/link";

const SOURCES = [
  {
    icon: "🤖",
    name: "Google Play Store",
    detail: "Reviews fetched via google-play-scraper (calls Google's internal API). Sorted newest-first, filtered Jan 2026 → today.",
  },
  {
    icon: "🍎",
    name: "Apple App Store",
    detail: "Reviews fetched via app-store-scraper (Apple's public RSS / API). Country: India. Sorted by most recent.",
  },
  {
    icon: "👽",
    name: "Reddit",
    detail: "Posts scraped from relevant subreddits (r/india, r/bollywood, r/androidapps, etc.) via Reddit's public JSON API. No authentication required.",
  },
  {
    icon: "💬",
    name: "Quora",
    detail: "Quora snippets surfaced via DuckDuckGo search (site:quora.com gaana). Snippet text extracted with Cheerio.",
  },
  {
    icon: "🌐",
    name: "Web / News",
    detail: "Tech blogs, forum threads, and news articles found via DuckDuckGo. Page bodies extracted with Cheerio, falling back to search snippets.",
  },
  {
    icon: "🐦",
    name: "Twitter / X",
    detail: "Public tweets scraped from Nitter mirror instances (no Twitter API key required). Falls back gracefully if all instances are down.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-5 text-sm text-white/80">
          <Link href="/reviews" className="hover:text-white">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery</Link>
          <Link href="/about" className="text-white font-semibold border-b border-white">About</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">About & Limitations</h1>
        <p className="text-gray-500 mb-10">How Phase 4 scraping works, what we collect, and what we don't.</p>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-amber-800 mb-2">⚠️ Important Disclaimer</h2>
          <p className="text-amber-700 text-sm leading-relaxed">
            This MVP scrapes <strong>publicly available</strong> user-generated content.
            It does not represent Gaana's internal data, catalog, or proprietary systems.
            All scraped text is used solely for demonstration and research purposes.
          </p>
        </div>

        {/* Scraping sources */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📡 Scraping Sources</h2>
          <div className="space-y-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                <span className="text-2xl mt-0.5">{s.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Date range */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">📅 Date Range</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            All scrapers filter reviews to <strong>January 1, 2026 → today</strong>.
            Older content is discarded at the scraper level before PII removal and cleaning.
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🔒 Privacy & PII Removal</h2>
          <ul className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm text-gray-600">
            {[
              "Email addresses → replaced with [EMAIL]",
              "Indian & international phone numbers → replaced with [PHONE]",
              "Social media usernames (@handle) → replaced with [USERNAME]",
              "URLs within review text → replaced with [URL]",
              "Order / transaction IDs → replaced with [ID]",
              "No data is stored permanently — all reviews live in-memory for the session only",
              "HTTPS / TLS for all API communication",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Limitations */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">⚠️ Known Limitations</h2>
          <ul className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Twitter / X scraping depends on Nitter mirror availability — may return 0 results if all instances are down.</li>
            <li>Quora and Web/News use search snippet text; full article bodies are attempted but may be blocked by paywalls.</li>
            <li>Google Play and App Store may rate-limit after many consecutive requests — delays are built in but not foolproof.</li>
            <li>Reddit's public JSON API caps results at ~25 per page; more data requires OAuth (not implemented here).</li>
            <li>Non-English reviews (Hindi, Tamil, etc.) are captured but not translated — AI analysis in Phase 3 works best on English text.</li>
          </ul>
        </section>

        {/* Tech stack */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">🛠 Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Frontend", value: "Next.js 15 + Tailwind CSS" },
              { label: "Backend", value: "Node.js + Express" },
              { label: "Play scraper", value: "google-play-scraper v10" },
              { label: "App Store", value: "app-store-scraper v0.18" },
              { label: "Web scraper", value: "Axios + Cheerio" },
              { label: "AI Engine", value: "Groq API (Phase 4)" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
