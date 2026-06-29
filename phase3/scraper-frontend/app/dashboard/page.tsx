"use client";

/**
 * /dashboard – Review Dashboard scaffold for Phase 2.
 * Phase 3 will wire up Groq AI analysis here.
 * For now it shows a clear "bring your scraped reviews here" CTA.
 */
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-5 text-sm text-white/80">
          <Link href="/reviews" className="hover:text-white">Reviews</Link>
          <Link href="/dashboard" className="text-white font-semibold border-b border-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Phase 3 – Coming Next
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Review Analysis Dashboard</h1>
          <p className="text-gray-500">
            After scraping, Groq AI will analyse all reviews and surface themes,
            sentiment, pain points and opportunities here.
          </p>
        </div>

        {/* Metric placeholders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Reviews Analysed", value: "—" },
            { label: "Themes Found", value: "—" },
            { label: "Sentiment", value: "—" },
            { label: "Top Pain Point", value: "—" },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-300">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* What Phase 3 will add */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">What Phase 3 will deliver</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: "🎯", title: "Theme Extraction", desc: "Up to 5 AI-generated themes from all review text" },
              { icon: "😊", title: "Sentiment Analysis", desc: "Positive / neutral / negative breakdown with percentages" },
              { icon: "💬", title: "Representative Quotes", desc: "3–5 real user quotes per theme" },
              { icon: "🚀", title: "Opportunity Summary", desc: "AI-generated business opportunity and problem statement" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-sm text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/reviews"
            className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            ← Scrape Reviews First
          </Link>
          <Link
            href="/discovery"
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Try Discovery Agent →
          </Link>
        </div>
      </main>
    </div>
  );
}
