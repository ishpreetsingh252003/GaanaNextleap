"use client";

import Link from "next/link";

const DATA_SOURCES = [
  {
    icon: "🤖",
    name: "Google Play Store",
    detail: "User reviews fetched via google-play-scraper. Sorted newest-first, filtered for recent feedback.",
  },
  {
    icon: "🍎",
    name: "Apple App Store",
    detail: "Reviews fetched via app-store-scraper. Country: India. Sorted by most recent.",
  },
  {
    icon: "👽",
    name: "Reddit",
    detail: "Posts scraped from relevant subreddits via Reddit's public JSON API.",
  },
  {
    icon: "💬",
    name: "Quora",
    detail: "Snippets surfaced via DuckDuckGo search (site:quora.com gaana). Text extracted with Cheerio.",
  },
  {
    icon: "🌐",
    name: "Web / News",
    detail: "Tech blogs, forums, and news articles found via DuckDuckGo. Bodies extracted with Cheerio.",
  },
  {
    icon: "🐦",
    name: "Twitter / X",
    detail: "Public tweets scraped from Nitter mirror instances. Falls back gracefully if all instances are down.",
  },
];

const TECH_STACK = [
  { label: "Frontend", value: "Next.js 15 (App Router)" },
  { label: "Styling", value: "Tailwind CSS v3" },
  { label: "Backend", value: "Node.js + Express" },
  { label: "AI Engine", value: "Groq API (Llama 3.3 70B)" },
  { label: "Scrapers", value: "google-play-scraper, app-store-scraper, Axios + Cheerio" },
  { label: "Type Safety", value: "TypeScript 5" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow" role="banner">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80" role="navigation" aria-label="Main navigation">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="text-white font-semibold border-b border-white" aria-current="page">About</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">About Gaana Discovery AI</h1>
        <p className="text-gray-500 mb-10">
          A product concept built to validate whether AI-powered, user-controlled music discovery can reduce repetitive listening on Indian streaming platforms.
        </p>

        {/* Why this was built */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🎯 Why This Was Built</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>
              Gaana has millions of users and strong recommendation systems, but a significant percentage of listening still comes from repeat playlists, familiar artists, and previously discovered tracks.
            </p>
            <p>
              <strong>The strategic goal</strong> is to increase meaningful music discovery and reduce repetitive listening behavior — validated through real public user feedback, not assumptions.
            </p>
            <p>
              This project was built as a NextLeap graduation project to explore whether an AI-native, controllable discovery experience can address the recommendation fatigue that users report across app store reviews, Reddit, and online forums.
            </p>
          </div>
        </section>

        {/* Validation approach */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">📊 Review-Led Validation Approach</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-700 leading-relaxed space-y-3">
            <p>
              Instead of conducting surveys or user interviews, this project uses a <strong>review-led validation approach</strong> — leveraging publicly available user feedback signals from app store reviews, Reddit discussions, Quora threads, and tech blogs as the primary validation source.
            </p>
            <p>
              The Review Engine scrapes and aggregates real user opinions from 6 public sources. The AI then performs thematic analysis to extract pain points, frustrations, and opportunity areas — producing structured insights equivalent to qualitative research outputs.
            </p>
            <p className="text-gray-500 italic">
              No surveys or interviews were conducted. All validation signals come from publicly available user reviews and online feedback.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">⚙️ How It Works</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">1. Review Engine (Part 1–2)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Scrapes user reviews from Google Play Store, Apple App Store, Reddit, Quora, Twitter/X, and Web sources. All scraped text passes through a PII removal pipeline (emails, phone numbers, usernames, URLs, and IDs are masked). The cleaned reviews are then sent to Groq&apos;s Llama 3.3 70B model for AI-powered thematic analysis — extracting themes, pain points, representative quotes, sentiment distribution, target user segments, and business opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">2. Analysis Dashboard (Part 2)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Displays the structured AI analysis output: problem statement, key themes with counts and quotes, sentiment breakdown (positive/neutral/negative), target user segment, and business opportunity. Can load either live analysis from the Review Engine or pre-generated sample data for demo purposes.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">3. Discovery Agent (Part 3–4)</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                An AI-powered music recommendation agent that lets users control discovery parameters: mood, language, activity context, freshness preference, reference artists, and what to avoid (repeated artists, mainstream hits, overplayed tracks, etc.). The agent sends structured preferences to Groq&apos;s LLM, which returns personalized track recommendations with explanations of why each track fits.
              </p>
            </div>
          </div>
        </section>

        {/* MVP Disclaimer */}
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

        {/* Data Sources */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">📡 Data Sources</h2>
          <div className="space-y-3">
            {DATA_SOURCES.map((s) => (
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

        {/* Privacy */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🔒 Privacy &amp; Data Protection</h2>
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

        {/* Future Scope */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🚀 Future Scope &amp; Validation Notes</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="flex gap-3">
              <span className="text-gray-400 mt-0.5 shrink-0">→</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">User Interviews &amp; Surveys</p>
                <p className="text-sm text-gray-600">Conduct direct user research to validate review-derived insights and test Discovery Agent prototypes with real listeners.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 mt-0.5 shrink-0">→</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Full Catalog Integration</p>
                <p className="text-sm text-gray-600">Connect to Gaana&apos;s internal catalog and playback APIs for real track results, audio previews, and one-tap play.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 mt-0.5 shrink-0">→</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Collaborative Filtering &amp; Listening History</p>
                <p className="text-sm text-gray-600">Layer user profiles and collaborative filtering on top of LLM-based discovery for truly personalized results.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 mt-0.5 shrink-0">→</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">A/B Testing &amp; Metrics</p>
                <p className="text-sm text-gray-600">Measure discovery rate, repeat-play reduction, and session length improvements through controlled experiments.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Known Limitations */}
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
                <span>Quora and Web/News use search snippet text; full article bodies may be blocked by paywalls.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Google Play and App Store may rate-limit after many consecutive requests.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Recommendations are based on public metadata only — not Gaana&apos;s internal catalog or proprietary data.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                <span>Personalization is rule-based + LLM inference. No user profiles, listening history, or collaborative filtering.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tech Stack */}
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
