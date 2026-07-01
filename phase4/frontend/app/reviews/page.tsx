"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getSources,
  scrapeReviews,
  analyzeReviews,
  SourceInfo,
  ReviewSource,
  ScrapeResponse,
  Review,
} from "../../lib/api";

// ── Source config ──────────────────────────────────────────────────────────
const SOURCE_ICONS: Record<ReviewSource, string> = {
  google_play: "🤖",
  app_store: "🍎",
  reddit: "👽",
  quora: "💬",
  web_news: "🌐",
  twitter_web: "🐦",
};

const SOURCE_COLORS: Record<ReviewSource, string> = {
  google_play: "bg-green-100 border-green-300 text-green-800",
  app_store: "bg-gray-100 border-gray-300 text-gray-800",
  reddit: "bg-orange-100 border-orange-300 text-orange-800",
  quora: "bg-red-100 border-red-300 text-red-800",
  web_news: "bg-blue-100 border-blue-300 text-blue-800",
  twitter_web: "bg-sky-100 border-sky-300 text-sky-800",
};

type ScrapeStatus = "idle" | "loading" | "success" | "error";

export default function ReviewsPage() {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selected, setSelected] = useState<ReviewSource[]>([]);
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<ReviewSource | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Load available sources on mount
  useEffect(() => {
    getSources()
      .then((data) => {
        setSources(data.sources);
        setSelected(data.sources.map((s) => s.id)); // all selected by default
      })
      .catch(() => {
        // Backend not running — show static list
        const fallback: SourceInfo[] = [
          { id: "google_play", label: "Google Play Store", description: "" },
          { id: "app_store", label: "Apple App Store", description: "" },
          { id: "reddit", label: "Reddit", description: "" },
          { id: "quora", label: "Quora", description: "" },
          { id: "web_news", label: "Web / News", description: "" },
          { id: "twitter_web", label: "Twitter / X", description: "" },
        ];
        setSources(fallback);
        setSelected(fallback.map((s) => s.id));
      });
  }, []);

  function toggleSource(id: ReviewSource) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleScrape() {
    if (selected.length === 0) return;
    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    setAnalysis(null);
    setCurrentPage(1);

    try {
      const data = await scrapeReviews(selected);
      setResult(data);

      const analysisResponse = await analyzeReviews(data.reviews);
      setAnalysis(analysisResponse.analysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(analysisResponse.analysis));

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Scraping or analysis failed");
      setStatus("error");
    }
  }

  // ── Filtering & pagination ──────────────────────────────────────────────
  const filteredReviews: Review[] = result
    ? result.reviews.filter((r) => {
        const matchesSource = filterSource === "all" || r.source === filterSource;
        const matchesSearch =
          !searchTerm ||
          r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSource && matchesSearch;
      })
    : [];

  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-5 text-sm text-white/80">
          <Link href="/reviews" className="text-white font-semibold border-b border-white">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Review Engine</h1>
          <p className="text-gray-500 text-sm">
            Scrapes reviews and discussions from Google Play, App Store, Reddit,
            Quora, Web news, and Twitter — filtered to <strong>Jan 2026 → today</strong>.
          </p>
        </div>

        {/* ── Source selector ── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Select Sources</h2>
            <div className="flex gap-3 text-xs">
              <button
                onClick={() => setSelected(sources.map((s) => s.id))}
                className="text-purple-600 hover:underline"
              >
                Select all
              </button>
              <button
                onClick={() => setSelected([])}
                className="text-gray-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sources.map((src) => {
              const isOn = selected.includes(src.id);
              return (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isOn
                      ? SOURCE_COLORS[src.id] + " shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                >
                  <span className="text-xl">{SOURCE_ICONS[src.id]}</span>
                  <span>{src.label}</span>
                  {isOn && <span className="ml-auto text-xs">✓</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleScrape}
            disabled={status === "loading" || selected.length === 0}
            className="mt-5 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Scraping {selected.length} source{selected.length !== 1 ? "s" : ""}…
              </span>
            ) : (
              `🔍 Scrape ${selected.length} Source${selected.length !== 1 ? "s" : ""}`
            )}
          </button>

          {status === "loading" && (
            <p className="mt-3 text-center text-xs text-gray-400">
              This may take 30–90 seconds depending on sources selected. Please wait…
            </p>
          )}
        </section>

        {/* ── Error ── */}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Results ── */}
        {status === "success" && result && (
          <>
            {/* Summary cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Reviews" value={result.total_reviews.toString()} color="purple" />
              <StatCard label="Sources Hit" value={Object.keys(result.sources_summary).length.toString()} color="blue" />
              <StatCard
                label="Date From"
                value={new Date(result.date_range.from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                color="green"
              />
              <StatCard
                label="Date To"
                value={new Date(result.date_range.to).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                color="orange"
              />
            </section>

            {/* Per-source breakdown */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                Reviews per Source
              </h2>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(result.sources_summary) as [ReviewSource, number][]).map(
                  ([src, count]) => (
                    <span
                      key={src}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${SOURCE_COLORS[src]}`}
                    >
                      {SOURCE_ICONS[src]} {sourceLabel(src)}: <strong>{count}</strong>
                    </span>
                  )
                )}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg p-3">
                  ⚠️ Some sources had issues:{" "}
                  {result.errors.map((e) => `${sourceLabel(e.source)} (${e.message})`).join(", ")}
                </div>
              )}
            </section>

            {/* Filter bar */}
            <section className="flex flex-col md:flex-row gap-3 mb-5">
              <input
                type="text"
                placeholder="Search review text…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value as ReviewSource | "all"); setCurrentPage(1); }}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="all">All sources</option>
                {(Object.keys(result.sources_summary) as ReviewSource[]).map((src) => (
                  <option key={src} value={src}>{sourceLabel(src)}</option>
                ))}
              </select>
              <span className="self-center text-sm text-gray-400 whitespace-nowrap">
                {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
              </span>
            </section>

            {/* Review cards */}
            <section className="space-y-3 mb-6">
              {paginatedReviews.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
                  No reviews match your filter.
                </div>
              ) : (
                paginatedReviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                >
                  Next →
                </button>
              </div>
            )}

            {/* CTA to next phase */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white text-center">
              <p className="text-lg font-semibold mb-1">Ready to analyse these reviews?</p>
              <p className="text-sm text-white/80 mb-4">
                Phase 3 will use Groq AI to extract themes, pain points, and sentiment from all {result.total_reviews} reviews.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-white text-purple-700 font-bold px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go to Analysis Dashboard →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_LEN = 180;
  const isLong = review.text.length > MAX_LEN;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SOURCE_COLORS[review.source]}`}>
            {SOURCE_ICONS[review.source]} {sourceLabel(review.source)}
          </span>
          {review.rating !== null && (
            <span className="text-xs text-yellow-600 font-medium">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {review.title && (
        <p className="font-semibold text-sm text-gray-800 mb-1">{review.title}</p>
      )}

      <p className="text-sm text-gray-600 leading-relaxed">
        {expanded || !isLong ? review.text : review.text.slice(0, MAX_LEN) + "…"}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-600 mt-1 hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">by {review.author}</span>
        {review.url && (
          <a
            href={review.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            Source ↗
          </a>
        )}
      </div>
    </div>
  );
}

function sourceLabel(s: ReviewSource): string {
  const labels: Record<ReviewSource, string> = {
    google_play: "Google Play",
    app_store: "App Store",
    reddit: "Reddit",
    quora: "Quora",
    web_news: "Web/News",
    twitter_web: "Twitter",
  };
  return labels[s];
}
