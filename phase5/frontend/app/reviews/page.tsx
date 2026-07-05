"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  analyzeReviews, loadFallbackAnalysis,
  ReviewSource, ScrapeResponse, Review, AnalysisResult, BackendError,
} from "../../lib/api";

const SOURCE_ICONS: Record<ReviewSource, string> = {
  google_play: "🤖", app_store: "🍎", reddit: "👽",
  quora: "💬", web_news: "🌐", twitter_web: "🐦",
};
const SOURCE_COLORS: Record<ReviewSource, string> = {
  google_play: "bg-green-100 border-green-300 text-green-800",
  app_store: "bg-gray-100 border-gray-300 text-gray-800",
  reddit: "bg-orange-100 border-orange-300 text-orange-800",
  quora: "bg-red-100 border-red-300 text-red-800",
  web_news: "bg-blue-100 border-blue-300 text-blue-800",
  twitter_web: "bg-sky-100 border-sky-300 text-sky-800",
};
const REVIEW_SOURCES: { id: ReviewSource; label: string }[] = [
  { id: "google_play", label: "Google Play" },
  { id: "app_store", label: "App Store" },
  { id: "reddit", label: "Reddit" },
  { id: "quora", label: "Quora" },
  { id: "web_news", label: "Web / News" },
  { id: "twitter_web", label: "Twitter / X" },
];
function sourceLabel(s: ReviewSource): string {
  return { google_play:"Google Play",app_store:"App Store",reddit:"Reddit",
    quora:"Quora",web_news:"Web/News",twitter_web:"Twitter" }[s];
}

function buildSourceSummary(reviews: Review[]): Partial<Record<ReviewSource, number>> {
  return reviews.reduce<Partial<Record<ReviewSource, number>>>((summary, review) => {
    summary[review.source] = (summary[review.source] ?? 0) + 1;
    return summary;
  }, {});
}

function buildCoveredSourceSummary(sources?: ReviewSource[], reviews: Review[] = []): Partial<Record<ReviewSource, number>> {
  if (!sources?.length) return buildSourceSummary(reviews);
  return sources.reduce<Partial<Record<ReviewSource, number>>>((summary, source) => {
    summary[source] = reviews.filter((review) => review.source === source).length || 1;
    return summary;
  }, {});
}

const INSIGHT_CARDS = [
  "Discovery works best when music feels fresh but still familiar.",
  "If recommendations feel random, users often return to old playlists.",
  "Mood, language, and activity are stronger discovery signals than genre alone.",
  "Repeat listening is not always bad — the problem is when users cannot easily find fresh alternatives.",
  "Freshness without relevance feels random. Familiarity without freshness feels repetitive.",
  "Regional music discovery is often harder when mainstream and viral content dominate feeds.",
];

const LOAD_STEPS = [
  "Collecting feedback signals",
  "Filtering selected sources",
  "Building evidence sample",
  "Discovering repeated themes",
  "Synthesizing product insights",
  "Preparing opportunity areas",
];

type ScrapeStatus = "idle" | "loading" | "success" | "error";

export default function ReviewsPage() {
  const [selectedSources, setSelectedSources] = useState<string[]>(
    REVIEW_SOURCES.map((source) => source.id)
  );
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<ReviewSource | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInsight, setCurrentInsight] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeQuickRange, setActiveQuickRange] = useState<'30d' | '90d' | '2026' | 'custom'>("2026");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setDateError("Please select a valid date range.");
    } else if (end > new Date()) {
      setDateError("To date cannot be in the future.");
    } else {
      setDateError("");
    }
  }, [startDate, endDate]);

  function setDateRange(range: '30d' | '90d' | '2026') {
    setActiveQuickRange(range);
    const today = new Date();
    let fromDate = new Date();
    if (range === '30d') {
      fromDate.setDate(today.getDate() - 30);
    } else if (range === '90d') {
      fromDate.setDate(today.getDate() - 90);
    } else if (range === '2026') {
      fromDate = new Date("2026-01-01");
    }
    setStartDate(fromDate.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }

  function toggleSource(id: ReviewSource) {
    setSelectedSources((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  }

  // Step ticker during loading
  function startStepTicker() {
    setLoadStep(0);
    setCurrentInsight(0);
    let step = 0;
    const stepIv = setInterval(() => {
      step = Math.min(step + 1, LOAD_STEPS.length - 1);
      setLoadStep(step);
    }, 3500);
    const insightIv = setInterval(() => {
      setCurrentInsight(prev => (prev + 1) % INSIGHT_CARDS.length);
    }, 4000);
    return () => {
      clearInterval(stepIv);
      clearInterval(insightIv);
    };
  }

  async function handleFallbackLoad() {
    setStatus("loading"); setErrorMsg("");
    const clearTicker = startStepTicker();
    try {
      // Simulate a short delay for the loading screen to be appreciated
      await new Promise(resolve => setTimeout(resolve, 2000));
      const demoStartDate = "2026-01-01";
      const demoEndDate = new Date().toISOString().split("T")[0];
      const allSources = REVIEW_SOURCES.map((source) => source.id);
      const resp = await loadFallbackAnalysis(allSources, demoStartDate, demoEndDate);
      clearTicker();
      const fallbackAnalysis = resp.analysis;
      const representativeReviews = resp.representativeReviews ?? fallbackAnalysis.representativeReviews ?? [];
      const mockResponse: ScrapeResponse = {
        success: true,
        total_reviews: resp.totalReviews ?? fallbackAnalysis.total_reviews_analyzed,
        date_range: { from: demoStartDate, to: demoEndDate },
        sources_summary: buildCoveredSourceSummary(resp.sourcesUsed, representativeReviews),
        reviews: representativeReviews,
        message: resp.message ?? fallbackAnalysis.message,
        sourceDiagnostics: resp.sourceDiagnostics,
      };
      setResult(mockResponse);
      setAnalysis(fallbackAnalysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(fallbackAnalysis));
      setStatus("success"); setCurrentPage(1);
    } catch (err) {
      clearTicker();
      const msg = err instanceof BackendError ? err.message : "Failed to load fallback data";
      setErrorMsg(msg); setStatus("error");
    }
  }

  async function handleScrape() {
    if (selectedSources.length === 0 || dateError) return;
    setStatus("loading"); setErrorMsg(""); setResult(null); setAnalysis(null); setCurrentPage(1);
    const clearTicker = startStepTicker();
    try {
      const resp = await analyzeReviews([], selectedSources as ReviewSource[], startDate, endDate, true);
      clearTicker(); 
      setLoadStep(5);
      const representativeReviews = resp.representativeReviews ?? resp.analysis.representativeReviews ?? [];
      setResult({
        success: true,
        total_reviews: resp.totalReviews ?? resp.analysis.total_reviews_analyzed ?? representativeReviews.length,
        date_range: { from: startDate, to: endDate },
        sources_summary: buildCoveredSourceSummary(resp.sourcesUsed, representativeReviews),
        reviews: representativeReviews,
        message: resp.message ?? resp.analysis.message,
        sourceDiagnostics: resp.sourceDiagnostics,
      }); 
      setAnalysis(resp.analysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(resp.analysis));
      setStatus("success");
    } catch (err) {
      clearTicker();
      const msg = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Review analysis could not complete. Please run the full demo analysis for a reliable evaluation view.";
      setErrorMsg(msg); setStatus("error");
    }
  }

  const filteredReviews: Review[] = result
    ? result.reviews.filter((r) => {
        const ms = filterSource === "all" || r.source === filterSource;
        const mt = !searchTerm || r.text.toLowerCase().includes(searchTerm.toLowerCase()) || r.title.toLowerCase().includes(searchTerm.toLowerCase());
        return ms && mt;
      })
    : [];
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const paged = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const analysisMode = analysis?.analysisMode || (analysis as any)?.analysis_mode || (analysis?.is_fallback ? "Reliable analysis" : "Groq analysis");

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <header className="bg-black/20 backdrop-blur-sm text-white px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Gaana Discovery AI</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-white/80">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="text-white font-semibold border-b-2 border-red-500">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Fresh Finds</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Review Engine</h1>
          <p className="text-white/60 text-sm">
            Analyzes Gaana feedback signals from Google Play, App Store, Reddit, Quora, Web news, and Twitter — filtered to <strong>Jan 2026 → today</strong>. Runs AI theme analysis on the results.
          </p>
        </div>

        <section ref={reviewsRef} className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="font-semibold text-white mb-3">Select feedback date range</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor="start-date" className="text-xs text-white/60 mb-1 block">From</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              </div>
              <div>
                <label htmlFor="end-date" className="text-xs text-white/60 mb-1 block">To</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500"/>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDateRange("30d")} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeQuickRange === '30d' ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:bg-white/10'}`}>Last 30 days</button>
              <button onClick={() => setDateRange("90d")} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeQuickRange === '90d' ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:bg-white/10'}`}>Last 90 days</button>
              <button onClick={() => setDateRange("2026")} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeQuickRange === '2026' ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:bg-white/10'}`}>2026 so far</button>
              <button onClick={() => setActiveQuickRange("custom")} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeQuickRange === 'custom' ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:bg-white/10'}`}>Custom</button>
            </div>
            {dateError && <p className="text-red-400 text-xs mt-2">{dateError}</p>}
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="font-semibold text-white">Select Sources</h2>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setSelectedSources(REVIEW_SOURCES.map((source) => source.id))} className="text-red-400 hover:text-red-300 transition-colors">Select all</button>
                <button onClick={() => setSelectedSources([])} className="text-white/40 hover:text-white/60 transition-colors">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {REVIEW_SOURCES.map((src) => {
                const isOn = selectedSources.includes(src.id);
                return (
                  <button key={src.id} onClick={() => toggleSource(src.id)} aria-pressed={isOn}
                    className={`flex items-center gap-3 border rounded-2xl px-4 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${isOn ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/50 text-white shadow-lg shadow-red-500/10" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:bg-white/10"}`}>
                    <span className="text-2xl">{SOURCE_ICONS[src.id]}</span>
                    <span className="text-left">{src.label}</span>
                    {isOn && <span className="ml-auto text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={handleScrape} disabled={status === "loading" || selectedSources.length === 0}
            className="mt-6 w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500">
            {status === "loading"
              ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span>{LOAD_STEPS[loadStep]}</span>
              : selectedSources.length > 0 ? "Analyze Selected Sources" : "Select at least one source to analyze"}
          </button>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button onClick={handleFallbackLoad} disabled={status === "loading"}
              className="w-full sm:w-auto text-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 backdrop-blur-sm">
              Run Full Demo Analysis
            </button>
            <span className="text-xs text-white/40 max-w-xs">Uses 100+ public-review-style feedback entries across app reviews and public discussion sources.</span>
          </div>

          {status === "loading" && <LoadingInsights loadStep={loadStep} currentInsight={currentInsight} />}
        </section>

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6 text-sm backdrop-blur-sm" role="alert">
            <p className="font-semibold text-red-400 mb-2">⚠️ Review fetching or analysis encountered an issue</p>
            <p className="text-red-300 mb-3">{errorMsg}</p>
            <p className="text-white/50 text-xs mb-3">Live fetching may fail due to public source restrictions or network issues. Use fallback review data to continue.</p>
            <button onClick={handleFallbackLoad} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-4 py-2 rounded-lg text-xs">
              💡 Run Demo Analysis
            </button>
          </div>
        )}

        {status === "success" && result && analysis && (
          <>
            {analysis.is_fallback && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl text-amber-300 text-xs backdrop-blur-sm">
                <strong>💡 Sample analysis generated from fallback public-review-style data for demo reliability.</strong>
                <br />This pre-generated analysis is shown for demo reliability and represents common public review frustrations.
              </div>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Reviews Analyzed" value={result.total_reviews.toString()} color="red" />
              <StatCard label="Sources Covered" value={Object.keys(result.sources_summary).length.toString()} color="pink" onClick={() => {
                setFilterSource("all");
                reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
              }} />
              <StatCard label="Date Range" value={`${new Date(result.date_range.from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} – ${new Date(result.date_range.to).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`} color="purple" />
              <StatCard label="Analysis Mode" value={formatAnalysisMode(analysisMode)} color="orange" />
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
              <h2 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Analysis Details</h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="text-sm text-white/80">
                    <span className="font-medium">Date range analyzed:</span> {new Date(result.date_range.from).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} to {new Date(result.date_range.to).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="text-sm text-white/80">
                    <span className="font-medium">Sources:</span> {(Object.keys(result.sources_summary) as ReviewSource[]).map(sourceLabel).join(', ')}
                  </div>
              </div>
            </section>

            {result.sourceDiagnostics && result.sourceDiagnostics.length > 0 && (
              <section className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics((value) => !value)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                  aria-expanded={showDiagnostics}
                >
                  <span className="font-semibold text-white text-sm uppercase tracking-wide">Source collection details</span>
                  <span className="text-xs text-white/50">{showDiagnostics ? "Hide" : "Show"}</span>
                </button>
                {showDiagnostics && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.sourceDiagnostics.map((diag) => (
                      <div key={diag.source} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="font-semibold text-sm text-white">{diag.label}</p>
                          <span className="text-[11px] rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-white/60">
                            {formatFetcherType(diag.fetcherType)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <DiagnosticMetric label="Live" value={diag.liveRawCount} />
                          <DiagnosticMetric label="Fallback" value={diag.fallbackRawCount} />
                          <DiagnosticMetric label="Used" value={diag.finalCountUsed} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/50">
                          <span>Fallback: {diag.fallbackUsed ? "Yes" : "No"}</span>
                          <span>Invalid dates: {diag.invalidDateCount}</span>
                          <span>Duplicates removed: {diag.removedDuplicateCount}</span>
                        </div>
                        {diag.reason && <p className="mt-2 text-xs text-white/45">{formatDiagnosticReason(diag.reason)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="flex flex-col md:flex-row gap-3 mb-5">
              <input type="text" placeholder="Search review text…" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm" />
              <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value as ReviewSource | "all"); setCurrentPage(1); }}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm">
                <option value="all" className="bg-gray-900">All sources</option>
                {(Object.keys(result.sources_summary) as ReviewSource[]).map((src) => (
                  <option key={src} value={src} className="bg-gray-900">{sourceLabel(src)}</option>
                ))}
              </select>
              <span className="self-center text-sm text-white/50">{paged.length > 0 ? `Showing ${paged.length} of ${filteredReviews.length} reviews` : 'No matching reviews'}</span>
            </section>

            <section className="space-y-3 mb-6">
              <p className="text-sm text-white/60 mb-4">
                {formatAnalysisMode(analysisMode) === "Demo"
                  ? `Showing representative reviews from ${result.total_reviews} demo feedback entries across all sources.`
                  : `Showing representative reviews from ${result.total_reviews} entries matching your selected sources and date range.`}
              </p>
              {result.message && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300 backdrop-blur-sm">
                  {result.message}
                </div>
              )}
              {paged.length === 0
                ? <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40 backdrop-blur-sm">No reviews match your filter.</div>
                : paged.map((r) => <ReviewCard key={r.id} review={r} />)}
            </section>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-white/20 text-sm text-white/80 disabled:opacity-40 hover:bg-white/10 transition-colors">← Prev</button>
                <span className="text-sm text-white/50">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-white/20 text-sm text-white/80 disabled:opacity-40 hover:bg-white/10 transition-colors">Next →</button>
              </div>
            )}

            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white text-center shadow-lg shadow-red-500/25">
              <p className="text-lg font-semibold mb-1">Analysis ready — view full insights</p>
              <p className="text-sm text-white/80 mb-4">Themes, pain points, sentiment, problem statement, and opportunity areas are waiting on the dashboard.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard" className="inline-block bg-white text-red-600 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  Go to Analysis Dashboard →
                </Link>
                <Link href="/discovery" className="inline-block bg-black/20 border border-white/40 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-black/30 transition-colors">
                  Try Fresh Finds MVP
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: string;
  color: string;
  onClick?: () => void;
}) {
  const c: Record<string, string> = {
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  };

  const clickable = typeof onClick === "function";

  return (
    <div
      className={`border rounded-2xl p-4 backdrop-blur-sm ${c[color]} ${
        clickable ? "cursor-pointer hover:brightness-110" : ""
      }`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function formatAnalysisMode(mode: string) {
  const normalized = mode.replace(/_/g, " ").toLowerCase();
  if (normalized.includes("mixed")) return "Mixed";
  if (normalized.includes("demo")) return "Demo";
  if (normalized.includes("reliable")) return "Reliable";
  if (normalized.includes("groq")) return "Live AI";
  return "Analysis";
}

function DiagnosticMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="text-[11px] text-white/45">{label}</p>
    </div>
  );
}

function formatFetcherType(type: string) {
  const labels: Record<string, string> = {
    live: "Live",
    live_with_credentials: "Live with credentials",
    placeholder: "Search adapter",
    fallback_assisted: "Needs API key",
    fallback_only: "Fallback only",
  };
  return labels[type] || type.replace(/_/g, " ");
}

function formatDiagnosticReason(reason: string) {
  const labels: Record<string, string> = {
    live_fetch_succeeded: "Live collection succeeded.",
    live_fetch_returned_limited: "Live collection returned a small sample, so source-level reliable data was added.",
    live_fetch_returned_empty: "Live collection returned no usable entries; reliable data was used for this source.",
    source_timeout: "The source took too long to respond; reliable data was used for this source.",
    missing_app_store_app_id: "App Store live collection needs APP_STORE_APP_ID.",
    rss_fetch_succeeded: "App Store RSS collection succeeded.",
    rss_returned_empty: "App Store RSS returned no matching reviews.",
    parser_returned_empty: "App Store RSS responded, but no review entries were parsed.",
    reddit_oauth_succeeded: "Reddit OAuth collection succeeded.",
    reddit_auth_missing_public_fetch_used: "Reddit credentials are missing; public JSON collection was used.",
    reddit_auth_missing_or_public_fetch_limited: "Reddit live mode works best with OAuth credentials; reliable data was used.",
    web_search_succeeded: "Configured web search collection succeeded.",
    community_search_succeeded: "Configured community search collection succeeded.",
    missing_web_search_provider: "Live collection needs a configured search provider key.",
    x_api_succeeded: "X API collection succeeded.",
    x_bearer_token_missing_public_no_auth_unavailable: "X needs a Bearer Token for live collection. Using fallback corpus for this source.",
    fallback_used_for_source: "Reliable source-level data was used for this source.",
  };
  return labels[reason] || `Reason: ${reason.replace(/_/g, " ")}`;
}

function LoadingInsights({ loadStep, currentInsight }: { loadStep: number; currentInsight: number }) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-red-500/20 bg-black/30 p-4 sm:p-5 shadow-lg shadow-red-500/10">
      <div>
        <h2 className="font-semibold text-white mb-4">Analysis in progress</h2>
        <ul className="space-y-3">
          {LOAD_STEPS.map((step, i) => (
            <li key={step} className={`flex items-center gap-3 text-sm transition-opacity ${i <= loadStep ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= loadStep ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" : "bg-white/10 text-white/40"}`}>
                {i < loadStep ? "✓" : i + 1}
              </div>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 min-h-48">
        <h3 className="font-semibold text-white mb-3 text-center">Music Discovery Insights</h3>
        <div className="relative min-h-28">
          {INSIGHT_CARDS.map((insight, i) => (
            <div key={insight} className={`absolute inset-0 flex items-center transition-opacity duration-500 ${i === currentInsight ? "opacity-100" : "opacity-0"}`}>
              <p className="text-white/80 leading-relaxed text-sm sm:text-base text-center">"{insight}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 180;
  const isLong = review.text.length > MAX;
  return (
    <article className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border bg-white/10 border-white/20 text-white/80`}>
            {SOURCE_ICONS[review.source]} {sourceLabel(review.source)}
          </span>
          {review.rating !== null && (
            <span className="text-xs text-yellow-400 font-medium">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          )}
        </div>
        <time className="text-xs text-white/40 shrink-0" dateTime={review.date}>
          {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </time>
      </div>
      {review.title && <p className="font-semibold text-sm text-white mb-1">{review.title}</p>}
      <p className="text-sm text-white/70 leading-relaxed">
        {expanded || !isLong ? review.text : review.text.slice(0, MAX) + "…"}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-red-400 mt-1 hover:text-red-300 transition-colors">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-white/40">by {review.author}</span>
        {review.url && <a href={review.url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 transition-colors">Source ↗</a>}
      </div>
    </article>
  );
}
