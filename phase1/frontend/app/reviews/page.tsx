"use client";

/**
 * /reviews – Review Engine page (Phase 2 will wire up the full pipeline)
 * Phase 1 scaffold: displays the page shell and navigates correctly.
 */
import Link from "next/link";

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          🎵 Gaana Discovery AI
        </Link>
        <nav className="flex gap-6 text-sm text-white/80">
          <Link href="/reviews" className="text-white font-semibold">
            Reviews
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
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            Phase 2 – Coming Next
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Review Engine</h1>
          <p className="text-gray-500">
            Fetch and analyse Google Play Store reviews to surface user pain
            points. Phase 2 will add the full review fetch, CSV upload, and
            data-cleaning pipeline.
          </p>
        </div>

        {/* Placeholder form shell */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App ID
            </label>
            <input
              type="text"
              defaultValue="com.gaana"
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                defaultValue="2026-01-01"
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Count (50–500)
            </label>
            <input
              type="number"
              defaultValue={300}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
            />
          </div>

          <button
            disabled
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold opacity-40 cursor-not-allowed"
          >
            Fetch Reviews (Available in Phase 2)
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Or{" "}
          <Link href="/discovery" className="text-purple-600 hover:underline">
            jump to the Discovery Agent →
          </Link>
        </p>
      </main>
    </div>
  );
}
