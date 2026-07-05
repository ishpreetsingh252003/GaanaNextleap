"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadFallbackAnalysis, AnalysisResult, AnalysisTheme, BackendError } from "../../lib/api";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("gaanaReviewAnalysis");
    if (stored) {
      try { setAnalysis(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  async function handleLoadSample() {
    setLoading(true); setErr("");
    try {
      const resp = await loadFallbackAnalysis();
      const a = resp.analysis;
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(a));
      setAnalysis(a);
    } catch (e) {
      setErr(e instanceof BackendError ? e.message : "Failed to load sample analysis.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <header className="bg-black/20 backdrop-blur-sm text-white px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-50">
        <Link href="/" className="font-bold text-lg flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Gaana Discovery AI</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-white/80">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="text-white font-semibold border-b-2 border-red-500">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Analysis Dashboard</h1>
          <p className="text-white/60 text-sm">
            AI-generated themes, pain points, sentiment, and opportunity areas from public feedback signals.
          </p>
        </div>

        {analysis?.is_fallback && (
          <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl text-xs text-amber-300 backdrop-blur-sm">
            <strong>💡 Sample fallback public review-style analysis loaded.</strong>{" "}
            This data is pre-generated for demo reliability and represents common public review frustrations about Indian music streaming discovery.
            These quotes are representative of public review-style feedback used for demo fallback.
          </div>
        )}

        {analysis ? (
          <>
            {/* Metric cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Reviews Analysed" value={String(analysis.total_reviews_analyzed ?? "—")} />
              <MetricCard label="Themes Found" value={String(analysis.themes?.length ?? 0)} />
              <MetricCard label="Negative Sentiment" value={`${analysis.sentiment_summary?.negative ?? 0}%`} highlight />
              <MetricCard label="Positive Sentiment" value={`${analysis.sentiment_summary?.positive ?? 0}%`} />
            </section>

            {/* Problem statement */}
            <section className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Problem Statement</h2>
              <p className="text-white leading-relaxed text-lg font-medium">{analysis.problem_statement}</p>
            </section>

            {/* Opportunity */}
            <section className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 mb-8 backdrop-blur-sm">
              <h2 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Opportunity</h2>
              <p className="text-white leading-relaxed text-lg font-medium">{analysis.business_opportunity}</p>
            </section>

            {/* 3-column info */}
            <section className="grid md:grid-cols-2 gap-5 mb-8">
              <InfoCard title="Summary" body={analysis.summary} />
              <InfoCard title="Target User Segment" body={analysis.target_user_segment} />
            </section>

            {/* Sentiment */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-5">Sentiment Distribution</h2>
              <div className="space-y-4">
                <SentimentBar label="Positive" value={analysis.sentiment_summary?.positive ?? 0} color="green" />
                <SentimentBar label="Neutral" value={analysis.sentiment_summary?.neutral ?? 0} color="yellow" />
                <SentimentBar label="Negative" value={analysis.sentiment_summary?.negative ?? 0} color="red" />
              </div>
            </section>

            {/* Themes */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Themes & Pain Points</h2>
              <div className="space-y-5">
                {(analysis.themes ?? []).map((theme, i) => (
                  <ThemeCard key={i} theme={theme} rank={i + 1} />
                ))}
              </div>
            </section>

            {/* CTA to discovery */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white text-center shadow-lg shadow-red-500/25">
              <p className="text-lg font-semibold mb-1">Ready to address these pain points?</p>
              <p className="text-sm text-white/80 mb-4">
                Fresh Finds lets users control mood, language, freshness, and avoid preferences — directly solving the issues surfaced above.
              </p>
              <Link href="/discovery" className="inline-block w-full sm:w-auto bg-white text-red-600 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Try Fresh Finds →
              </Link>
            </div>

            {/* Limitation notice */}
            <div className="mt-6 bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs text-amber-300 backdrop-blur-sm">
              <strong>Validation Limitation:</strong> No direct interviews were conducted in this version. Future validation should include 5–6 interviews with the chosen target segment.
            </div>
          </>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-xl font-semibold text-white mb-3">No analysis yet</p>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Run the Review Engine first to generate AI-powered themes and insights, or load the sample analysis to see what the dashboard looks like.
            </p>
            {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/reviews" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Go to Review Engine
              </Link>
              <button onClick={handleLoadSample} disabled={loading}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer backdrop-blur-sm">
                {loading ? "Loading…" : "💡 Load Sample Analysis"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-2xl p-5 backdrop-blur-sm text-center ${highlight ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"}`}>
      <p className={`text-3xl font-bold ${highlight ? "text-red-400" : "text-white"}`}>{value}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
      <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-white/80 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  const bar: Record<string, string> = {
    green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500",
  };
  return (
    <div>
      <div className="flex justify-between text-sm text-white/80 mb-1.5">
        <span>{label}</span><span className="font-medium">{value}%</span>
      </div>
      <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ThemeCard({ theme, rank }: { theme: AnalysisTheme; rank: number }) {
  const [open, setOpen] = useState(true);
  const rankColors = ["bg-red-500","bg-pink-500","bg-purple-500","bg-orange-500","bg-yellow-500"];
  const bg = rankColors[(rank - 1) % rankColors.length];
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/10 transition-colors">
        <span className={`${bg} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0`}>{rank}</span>
        <div className="flex-1">
          <p className="font-semibold text-white">{theme.theme_name}</p>
          <p className="text-xs text-white/50 mt-0.5">{theme.count} reviews · {theme.pain_point}</p>
        </div>
        <span className="text-white/40 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/10">
          <p className="text-sm text-white/70 leading-relaxed mt-4 mb-4">{theme.description}</p>

          {theme.representative_quotes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
                Public Review-Style Quotes
              </p>
              <ul className="space-y-2">
                {theme.representative_quotes.map((q, i) => (
                  <li key={i} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/80 italic">
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full">
              <strong>Pain:</strong> {theme.pain_point}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full">
              <strong>Opportunity:</strong> {theme.opportunity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
