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
    detail: "Posts scraped from relevant subreddits via Reddit's public JSON API. No authentication required.",
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

const TECH_STACK = [
  { label: "Frontend", value: "Next.js 15 + Tailwind CSS" },
  { label: "Backend", value: "Node.js + Express" },
  { label: "Play scraper", value: "google-play-scraper v10" },
  { label: "App Store", value: "app-store-scraper v0.18" },
  { label: "Web scraper", value: "Axios + Cheerio" },
  { label: "AI Engine", value: "Groq API" },
  { label: "Framework", value: "Next.js App Router" },
  { label: "Styling", value: "Tailwind CSS v3" },
  { label: "Type Safety", value: "TypeScript 5" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow" role="banner">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80" role="navigation" aria-label="Main navigation">
          <Link href="/reviews" className="hover:text-white transition-colors hidden sm:inline">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors hidden sm:inline">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors hidden sm:inline">Discovery</Link>
          <Link href="/about" className="text-white font-semibold border-b border-white" aria-current="page">About</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">About & Limitations</h1>
        <p className="text-gray-500 mb-10">
          Phase 5 graduation demo — data sources, privacy practices, project scope, and known limitations.
        </p>

        <section className="mb-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">⚠️ MVP Disclaimer</h2>
            <p className="text-amber-700 text-sm leading-relaxed">
              This MVP uses publicly available metadata/search results or sample catalog data to demonstrate the AI-powered discovery experience.
              It does <strong>not</strong> represent Gaana&apos;s full internal catalog.
              All scraped text is used solely for demonstration and research purposes.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📡 Data Sources</h2>
          <div className="space-y-3">
            {SOURCES.map((s) => (
              <div key={s.name} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow">
                <span className="text-2xl mt-0.5" aria-hidden="true">{s.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🔒 Privacy & Data Protection</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">PII Removal</h3>
                <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>Email addresses → replaced with [EMAIL]</li>
                  <li>Phone numbers → replaced with [PHONE]</li>
                  <li>Social media usernames → replaced with [USERNAME]</li>
                  <li>URLs → replaced with [URL]</li>
                  <li>Order / transaction IDs → replaced with [ID]</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Data Handling</h3>
                <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>No permanent storage — reviews live in-memory for the session only</li>
                  <li>HTTPS / TLS for all API communication</li>
                  <li>Data retention: session-only, cleared on refresh</li>
                  <li>No third-party sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🎯 Project Scope</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex gap-3">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Learning & Demonstration</p>
                <p className="text-sm text-gray-600">Built as an educational project to demonstrate AI-powered music discovery using open-source tools.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Multi-Source Scraping</p>
                <p className="text-sm text-gray-600">Aggregates feedback from 6 public sources for comprehensive analysis.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Not Production-Ready</p>
                <p className="text-sm text-gray-600">This is a demonstration MVP. Rate limits, data completeness, and error handling are not production-grade.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Catalog Limitations</p>
                <p className="text-sm text-gray-600">Recommendations are based on public metadata only — not Gaana&apos;s internal catalog or proprietary data.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Personalization Limits</p>
                <p className="text-sm text-gray-600">Personalization is rule-based + LLM inference. No user profiles, listening history, or collaborative filtering.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">⚠️ Known Limitations</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Twitter / X scraping depends on Nitter mirror availability — may return 0 results if all instances are down.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Quora and Web/News use search snippet text; full article bodies are attempted but may be blocked by paywalls.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Google Play and App Store may rate-limit after many consecutive requests — delays are built in but not foolproof.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Reddit&apos;s public JSON API caps results at ~25 per page; more data requires OAuth (not implemented here).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Non-English reviews (Hindi, Tamil, etc.) are captured but not translated — AI analysis works best on English text.</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">📬 Contact & Support</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-4">
              This project was built as a graduation demo. For questions or feedback about the architecture or implementation:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Review the <strong>Phase 5 frontend</strong> and <strong>backend</strong> repositories</li>
              <li>Check the <strong>README</strong> in each phase folder for setup instructions</li>
              <li>Open an issue in the project repository for bugs or feature requests</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">🛠 Tech Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TECH_STACK.map((item) => (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
