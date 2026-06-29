"use client";

/**
 * /dashboard – Review Dashboard page (Phase 3 will add AI analysis results)
 * Phase 1 scaffold: displays the page shell only.
 */
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🎵 Gaana Discovery AI
        </Link>
        <nav className="flex gap-6 text-sm text-white/80">
          <Link href="/reviews" className="hover:text-white transition-colors">
            Reviews
          </Link>
          <Link href="/dashboard" className="text-white font-semibold">
            Dashboard
          </Link>
          <Link href="/discovery" className="hover:text-white transition-colors">
            Discovery
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </nav>
      </header>

      {/* ── Content ── */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Phase 3 – Coming Soon
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Review Dashboard</h1>
          <p className="text-gray-500">
            AI-generated themes, sentiment breakdown, and user pain points will
            appear here after running the review analysis pipeline in Phase 3.
          </p>
        </div>

        {/* Placeholder metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Reviews Analysed", value: "—" },
            { label: "Date Range", value: "—" },
            { label: "Themes Found", value: "—" },
            { label: "Sentiment", value: "—" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm"
            >
              <p className="text-2xl font-bold text-gray-300">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400 mb-4">
            Complete the review analysis in Phase 3 to see insights here.
          </p>
          <Link
            href="/reviews"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors"
          >
            ← Back to Review Engine
          </Link>
        </div>
      </main>
    </div>
  );
}
