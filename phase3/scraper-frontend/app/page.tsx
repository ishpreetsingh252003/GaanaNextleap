"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ReviewSource =
  | "google_play"
  | "app_store"
  | "reddit"
  | "quora"
  | "web_news"
  | "twitter_web";

interface Review {
  id: string;
  source: ReviewSource;
  rating: number | null;
  title: string;
  text: string;
  author: string;
  date: string;
  url: string;
  lang: string;
}

interface ScrapeResult {
  success: boolean;
  total_reviews: number;
  date_range: { from: string; to: string };
  sources_summary: Partial<Record<ReviewSource, number>>;
  errors?: { source: ReviewSource; message: string }[];
  reviews: Review[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SOURCES: { id: ReviewSource; label: string; icon: string; color: string; ring: string }[] = [
  { id: "google_play", label: "Google Play", icon: "🤖", color: "bg-emerald-900/40 border-emerald-700/60 text-emerald-300", ring: "ring-emerald-500" },
  { id: "app_store",   label: "App Store",   icon: "🍎", color: "bg-slate-800/60 border-slate-600/60 text-slate-300",    ring: "ring-slate-400" },
  { id: "reddit",      label: "Reddit",      icon: "👽", color: "bg-orange-900/40 border-orange-700/60 text-orange-300", ring: "ring-orange-500" },
  { id: "quora",       label: "Quora",       icon: "💬", color: "bg-red-900/40 border-red-700/60 text-red-300",         ring: "ring-red-500"    },
  { id: "web_news",    label: "Web / News",  icon: "🌐", color: "bg-blue-900/40 border-blue-700/60 text-blue-300",      ring: "ring-blue-500"   },
  { id: "twitter_web", label: "Twitter / X", icon: "🐦", color: "bg-sky-900/40 border-sky-700/60 text-sky-300",         ring: "ring-sky-500"    },
];

const today = new Date().toISOString().slice(0, 10);
const jan2026 = "2026-01-01";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScraperPage() {
  const [selectedSources, setSelectedSources] = useState<ReviewSource[]>(
    SOURCES.map((s) => s.id)
  );
  const [fromDate, setFromDate] = useState(jan2026);
  const [toDate, setToDate]     = useState(today);
  const [status, setStatus]     = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult]     = useState<ScrapeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch]     = useState("");
  const [filterSrc, setFilterSrc] = useState<ReviewSource | "all">("all");
  const [page, setPage]         = useState(1);
  const PAGE_SIZE               = 25;
  const abortRef                = useRef<AbortController | null>(null);

  const toggle = (id: ReviewSource) =>
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const handleScrape = useCallback(async () => {
    if (selectedSources.length === 0) return;
    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    setPage(1);
    abortRef.current = new AbortController();

    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${backend}/api/reviews/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          sources: selectedSources,
          fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
          toDate:   toDate   ? new Date(toDate + "T23:59:59").toISOString() : undefined,
        }),
      });

      const data: ScrapeResult = await res.json();
      if (!res.ok || !data.success) {
        throw new Error((data as any).error_message || "Scraping failed");
      }
      setResult(data);
      setStatus("done");
    } catch (err: any) {
      if (err?.name === "AbortError") { setStatus("idle"); return; }
      setErrorMsg(err.message || "Unexpected error");
      setStatus("error");
    }
  }, [selectedSources, fromDate, toDate]);

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.reviews, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `gaana_reviews_${fromDate}_to_${toDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered + paginated
  const filtered = result
    ? result.reviews.filter((r) => {
        const src = filterSrc === "all" || r.source === filterSrc;
        const q   = !search || r.text.toLowerCase().includes(search.toLowerCase()) ||
                    r.title.toLowerCase().includes(search.toLowerCase());
        return src && q;
      })
    : [];
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const srcInfo     = (id: ReviewSource) => SOURCES.find((s) => s.id === id)!;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── HEADER ── */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-lg">🎵</div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Gaana Review Scraper</p>
              <p className="text-xs text-gray-500 mt-0.5">Multi-source collection engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
              Phase 3 – Scraper Frontend
            </span>
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
               className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full transition-colors">
              → Main App
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* ── CONTROL PANEL ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Sources */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Select Sources</h2>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setSelectedSources(SOURCES.map((s) => s.id))}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors">Select all</button>
                <button onClick={() => setSelectedSources([])}
                        className="text-gray-500 hover:text-gray-400 transition-colors">Clear</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SOURCES.map((src) => {
                const on = selectedSources.includes(src.id);
                return (
                  <button key={src.id} onClick={() => toggle(src.id)}
                          className={`relative flex items-center gap-3 border rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                            on ? `${src.color} ring-1 ${src.ring}` : "bg-gray-800/40 border-gray-700/40 text-gray-500 hover:bg-gray-800"
                          }`}>
                    <span className="text-xl">{src.icon}</span>
                    <span>{src.label}</span>
                    {on && <span className="absolute right-3 top-3.5 text-[10px] opacity-70">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Date + Launch */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
            <h2 className="font-semibold text-white">Date Range</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                             [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleScrape}
                disabled={status === "loading" || selectedSources.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  status === "loading"
                    ? "bg-indigo-800/60 text-indigo-300 cursor-not-allowed"
                    : selectedSources.length === 0
                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white glow-btn"
                }`}
              >
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Scraping {selectedSources.length} sources…
                  </span>
                ) : (
                  `🔍 Scrape ${selectedSources.length} Source${selectedSources.length !== 1 ? "s" : ""}`
                )}
              </button>

              {status === "loading" && (
                <button onClick={() => abortRef.current?.abort()}
                        className="w-full py-2 rounded-xl text-xs text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors">
                  Cancel
                </button>
              )}

              {result && (
                <button onClick={handleDownload}
                        className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-700 hover:bg-emerald-600 text-white transition-colors">
                  ⬇ Download JSON ({result.total_reviews} reviews)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── LOADING STATE ── */}
        {status === "loading" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
            <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300 font-medium">Scraping in progress…</p>
            <p className="text-gray-500 text-sm">
              This may take 30–120 seconds depending on sources selected. Sit tight!
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mt-4">
              {selectedSources.map((s) => (
                <div key={s} className="shimmer h-6 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === "error" && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-300">Scraping failed</p>
              <p className="text-sm text-red-400 mt-1">{errorMsg}</p>
              <p className="text-xs text-gray-500 mt-2">Make sure the backend is running on port 3001.</p>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {status === "done" && result && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Reviews", value: result.total_reviews.toLocaleString(), icon: "📋", col: "text-indigo-400" },
                { label: "Sources Hit",   value: Object.keys(result.sources_summary).length, icon: "🌐", col: "text-emerald-400" },
                { label: "From",          value: formatDate(result.date_range.from), icon: "📅", col: "text-blue-400" },
                { label: "To",            value: formatDate(result.date_range.to),   icon: "📅", col: "text-purple-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className={`text-2xl font-bold ${stat.col}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Source breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Reviews per Source</h3>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(result.sources_summary) as [ReviewSource, number][]).map(([src, count]) => {
                  const s = srcInfo(src);
                  return (
                    <span key={src} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${s.color}`}>
                      {s.icon} {s.label}: <strong>{count}</strong>
                    </span>
                  );
                })}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 text-xs text-orange-400 bg-orange-950/30 border border-orange-800/40 rounded-lg p-3">
                  ⚠️ Some sources had issues: {result.errors.map((e) => `${srcInfo(e.source).label} (${e.message})`).join(", ")}
                </div>
              )}
            </div>

            {/* Filter bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Search review text or title…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white
                           placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={filterSrc}
                onChange={(e) => { setFilterSrc(e.target.value as ReviewSource | "all"); setPage(1); }}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All sources</option>
                {(Object.keys(result.sources_summary) as ReviewSource[]).map((s) => (
                  <option key={s} value={s}>{srcInfo(s).label}</option>
                ))}
              </select>
              <span className="self-center text-sm text-gray-500 whitespace-nowrap">
                {filtered.length} review{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Review cards */}
            <div className="space-y-3">
              {paginated.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-600">
                  No reviews match your filter.
                </div>
              ) : (
                paginated.map((r) => <ReviewCard key={r.id} review={r} srcInfo={srcInfo(r.source)} />)
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm disabled:opacity-30 hover:bg-gray-800 transition-colors">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-700 text-sm disabled:opacity-30 hover:bg-gray-800 transition-colors">
                  Next →
                </button>
              </div>
            )}

            {/* Hand-off CTA */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-800/50 rounded-2xl p-6 text-center">
              <p className="text-lg font-semibold text-white mb-1">Ready to analyse these reviews with Groq AI?</p>
              <p className="text-sm text-gray-400 mb-4">
                Download the JSON above, then upload it to the Main App to extract themes, sentiment and insights.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={handleDownload}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  ⬇ Download JSON
                </button>
                <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer"
                   className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  Open Main App →
                </a>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Review Card Sub-component ─────────────────────────────────────────────────
function ReviewCard({
  review,
  srcInfo,
}: {
  review: Review;
  srcInfo: { label: string; icon: string; color: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 200;
  const isLong = review.text.length > MAX;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${srcInfo.color}`}>
            {srcInfo.icon} {srcInfo.label}
          </span>
          {review.rating !== null && (
            <span className="text-xs text-yellow-500">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600 shrink-0">
          {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {review.title && (
        <p className="font-semibold text-sm text-gray-200 mb-1">{review.title}</p>
      )}

      <p className="text-sm text-gray-400 leading-relaxed">
        {expanded || !isLong ? review.text : review.text.slice(0, MAX) + "…"}
      </p>

      {isLong && (
        <button onClick={() => setExpanded(!expanded)}
                className="text-xs text-indigo-400 mt-1 hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-600">by {review.author}</span>
        {review.url && (
          <a href={review.url} target="_blank" rel="noopener noreferrer"
             className="text-xs text-indigo-500 hover:underline">Source ↗</a>
        )}
      </div>
    </div>
  );
}
