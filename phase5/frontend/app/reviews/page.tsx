"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getSources, scrapeReviews, analyzeReviews, loadFallbackAnalysis,
  SourceInfo, ReviewSource, ScrapeResponse, Review, AnalysisResult, BackendError,
} from "../../lib/api";
import { cleanReviews } from "../../lib/cleanReviews";

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
function sourceLabel(s: ReviewSource): string {
  return { google_play:"Google Play",app_store:"App Store",reddit:"Reddit",
    quora:"Quora",web_news:"Web/News",twitter_web:"Twitter" }[s];
}

const LOAD_STEPS = [
  "Fetching public feedback from selected sources…",
  "Cleaning and deduplicating reviews…",
  "Removing personally identifiable information…",
  "Analysing themes with AI…",
  "Generating problem statement and opportunities…",
  "Finalising insights…",
];

type ScrapeStatus = "idle" | "loading" | "success" | "error";

export default function ReviewsPage() {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selected, setSelected] = useState<ReviewSource[]>([]);
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<ReviewSource | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    getSources()
      .then((d) => { setSources(d.sources); setSelected(d.sources.map((s) => s.id)); })
      .catch(() => {
        const fb: SourceInfo[] = [
          { id: "google_play", label: "Google Play Store", description: "" },
          { id: "app_store", label: "Apple App Store", description: "" },
          { id: "reddit", label: "Reddit", description: "" },
          { id: "quora", label: "Quora", description: "" },
          { id: "web_news", label: "Web / News", description: "" },
          { id: "twitter_web", label: "Twitter / X", description: "" },
        ];
        setSources(fb); setSelected(fb.map((s) => s.id));
      });
  }, []);

  function toggleSource(id: ReviewSource) {
    setSelected((p) => p.includes(id) ? p.filter((s) => s !== id) : [...p, id]);
  }

  // Step ticker during loading
  function startStepTicker() {
    setLoadStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step = Math.min(step + 1, LOAD_STEPS.length - 1);
      setLoadStep(step);
    }, 4000);
    return iv;
  }

  async function handleFallbackLoad() {
    setStatus("loading"); setErrorMsg(""); setLoadStep(0);
    try {
      const resp = await loadFallbackAnalysis();
      const fallbackAnalysis = resp.analysis;
      const mockReviews: Review[] = [
        { id:"fb-1",source:"google_play",rating:2,title:"Repeats same songs",text:"I am tired of listening to the same old songs. The app keeps recommending the same 10 hits over and over.",author:"Rahul S.",date:"2026-03-01T00:00:00Z",url:null,lang:"en" },
        { id:"fb-2",source:"app_store",rating:1,title:"Recommendations feel stale",text:"It does not matter if I choose chill or dance mood, it just plays the same viral Punjabi songs. Terrible discovery experience.",author:"Preeti K.",date:"2026-03-10T00:00:00Z",url:null,lang:"en" },
        { id:"fb-3",source:"reddit",rating:null,title:"Gaana playlist fatigue is real",text:"Does anyone else feel like Gaana keeps playing the exact same tracklist? I try to find underrated indie or regional music but it constantly pushes mainstream Bollywood.",author:"music_lover_99",date:"2026-04-12T00:00:00Z",url:null,lang:"en" },
        { id:"fb-4",source:"google_play",rating:3,title:"Needs activity-based music",text:"I want Gym music that actually matches my pace. Traditional recommendation is very poor at capturing my current context.",author:"Amit Verma",date:"2026-04-18T00:00:00Z",url:null,lang:"en" },
        { id:"fb-5",source:"quora",rating:null,title:"Why does Gaana recommend the same tracks?",text:"Recommender systems rely on popularity bias. If a Bollywood track is trending it spams everyone's discovery list. This is why you get stuck in listening loops.",author:"Aditya Roy",date:"2026-05-01T00:00:00Z",url:null,lang:"en" },
        { id:"fb-6",source:"web_news",rating:null,title:"The problem with streaming catalogs",text:"Users complain about repetitive loops on Gaana. Recommender systems struggle with the cold-start problem for emerging artists.",author:"Tech India Blog",date:"2026-05-20T00:00:00Z",url:null,lang:"en" },
        { id:"fb-7",source:"google_play",rating:2,title:"Fails to match mood",text:"I select Chill Hindi but it starts playing upbeat bhangra. Recommendation engine doesn't understand context or nuance.",author:"Sneha G.",date:"2026-06-05T00:00:00Z",url:null,lang:"en" },
        { id:"fb-8",source:"app_store",rating:2,title:"Bias towards mainstream",text:"Everything recommended is mainstream and viral. What if I want regional music that is niche? The algorithm forces hits upon us.",author:"Karthik R.",date:"2026-06-12T00:00:00Z",url:null,lang:"en" },
      ];
      const mockResponse: ScrapeResponse = {
        success: true, total_reviews: mockReviews.length,
        date_range: { from: "2026-01-01", to: new Date().toISOString() },
        sources_summary: { google_play:3, app_store:2, reddit:1, quora:1, web_news:1 } as any,
        reviews: mockReviews,
      };
      setResult(mockResponse);
      setAnalysis(fallbackAnalysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(fallbackAnalysis));
      setStatus("success"); setCurrentPage(1);
    } catch (err) {
      const msg = err instanceof BackendError ? err.message : "Failed to load fallback data";
      setErrorMsg(msg); setStatus("error");
    }
  }

  async function handleScrape() {
    if (selected.length === 0) return;
    setStatus("loading"); setErrorMsg(""); setResult(null); setAnalysis(null); setCurrentPage(1);
    const ticker = startStepTicker();
    try {
      const data = await scrapeReviews(selected);
      setLoadStep(3);
      const resp = await analyzeReviews(data.reviews);
      clearInterval(ticker); setLoadStep(5);
      setResult(data); setAnalysis(resp.analysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(resp.analysis));
      setStatus("success");
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Scraping or analysis failed";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/reviews" className="text-white font-semibold border-b border-white">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Review Engine</h1>
          <p className="text-gray-500 text-sm">
            Scrapes Gaana feedback from Google Play, App Store, Reddit, Quora, Web news, and Twitter — filtered to <strong>Jan 2026 → today</strong>. Runs AI theme analysis on the results.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Select Sources</h2>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setSelected(sources.map((s) => s.id))} className="text-purple-600 hover:underline">Select all</button>
              <button onClick={() => setSelected([])} className="text-gray-400 hover:underline">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sources.map((src) => {
              const isOn = selected.includes(src.id);
              return (
                <button key={src.id} onClick={() => toggleSource(src.id)} aria-pressed={isOn}
                  className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${isOn ? SOURCE_COLORS[src.id] + " shadow-sm" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                  <span className="text-xl">{SOURCE_ICONS[src.id]}</span>
                  <span>{src.label}</span>
                  {isOn && <span className="ml-auto text-xs">✓</span>}
                </button>
              );
            })}
          </div>

          <button onClick={handleScrape} disabled={status === "loading" || selected.length === 0}
            className="mt-5 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400">
            {status === "loading"
              ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span>{LOAD_STEPS[loadStep]}</span>
              : `🔍 Scrape & Analyse ${selected.length} Source${selected.length !== 1 ? "s" : ""}`}
          </button>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <button onClick={handleFallbackLoad} disabled={status === "loading"}
              className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-4 py-2 rounded-xl border border-purple-200 transition-colors disabled:opacity-40">
              💡 Load Fallback Public Review Data
            </button>
            <span className="text-xs text-gray-400">Use this if live scraping fails or for a quick demo</span>
          </div>
        </section>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-sm" role="alert">
            <p className="font-semibold text-red-700 mb-2">⚠️ Scraping or analysis encountered an issue</p>
            <p className="text-red-600 mb-3">{errorMsg}</p>
            <p className="text-gray-500 text-xs mb-3">Live fetching may fail due to public source restrictions or network issues. Use fallback review data to continue.</p>
            <button onClick={handleFallbackLoad} className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-lg text-xs">
              💡 Load Fallback Public Reviews & Run Analysis
            </button>
          </div>
        )}

        {status === "success" && result && analysis && (
          <>
            {analysis.is_fallback && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl text-amber-800 text-xs">
                <strong>💡 Sample fallback public review-style data loaded.</strong> This pre-generated analysis is shown for demo reliability and represents common public review frustrations.
                <br />These quotes are representative of public review-style feedback used for demo fallback — not individual user records.
              </div>
            )}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Reviews" value={result.total_reviews.toString()} color="purple" />
              <StatCard label="Sources" value={Object.keys(result.sources_summary).length.toString()} color="blue" />
              <StatCard label="Themes Found" value={(analysis.themes?.length ?? 0).toString()} color="green" />
              <StatCard label="Negative Sentiment" value={`${analysis.sentiment_summary?.negative ?? 0}%`} color="orange" />
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Sources</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(result.sources_summary) as [ReviewSource, number][]).map(([src, count]) => (
                  <span key={src} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${SOURCE_COLORS[src]}`}>
                    {SOURCE_ICONS[src]} {sourceLabel(src)}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col md:flex-row gap-3 mb-5">
              <input type="text" placeholder="Search review text…" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value as ReviewSource | "all"); setCurrentPage(1); }}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white">
                <option value="all">All sources</option>
                {(Object.keys(result.sources_summary) as ReviewSource[]).map((src) => (
                  <option key={src} value={src}>{sourceLabel(src)}</option>
                ))}
              </select>
              <span className="self-center text-sm text-gray-400">{filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}</span>
            </section>

            <section className="space-y-3 mb-6">
              {paged.length === 0
                ? <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No reviews match your filter.</div>
                : paged.map((r) => <ReviewCard key={r.id} review={r} />)}
            </section>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100">← Prev</button>
                <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100">Next →</button>
              </div>
            )}

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white text-center">
              <p className="text-lg font-semibold mb-1">Analysis ready — view full insights</p>
              <p className="text-sm text-white/80 mb-4">Themes, pain points, sentiment, problem statement, and opportunity areas are waiting on the dashboard.</p>
              <Link href="/dashboard" className="inline-block bg-white text-purple-700 font-bold px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Go to Analysis Dashboard →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const c: Record<string, string> = {
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };
  return (
    <div className={`border rounded-2xl p-4 ${c[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 180;
  const isLong = review.text.length > MAX;
  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SOURCE_COLORS[review.source]}`}>
            {SOURCE_ICONS[review.source]} {sourceLabel(review.source)}
          </span>
          {review.rating !== null && (
            <span className="text-xs text-yellow-600 font-medium">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          )}
        </div>
        <time className="text-xs text-gray-400 shrink-0" dateTime={review.date}>
          {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </time>
      </div>
      {review.title && <p className="font-semibold text-sm text-gray-800 mb-1">{review.title}</p>}
      <p className="text-sm text-gray-600 leading-relaxed">
        {expanded || !isLong ? review.text : review.text.slice(0, MAX) + "…"}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-purple-600 mt-1 hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">by {review.author}</span>
        {review.url && <a href={review.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Source ↗</a>}
      </div>
    </article>
  );
}
