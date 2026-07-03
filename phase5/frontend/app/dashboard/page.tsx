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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/reviews" className="hover:text-white">Review Engine</Link>
          <Link href="/dashboard" className="text-white font-semibold border-b border-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Analysis Dashboard</h1>
          <p className="text-gray-500 text-sm">
            AI-generated themes, pain points, sentiment, and opportunity areas from scraped user reviews.
          </p>
        </div>

        {analysis?.is_fallback && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl text-xs text-amber-800">
            <strong>💡 Sample fallback public review-style analysis loaded.</strong>{" "}
            This data is pre-generated for demo reliability and represents common public review frustrations about Indian music streaming discovery.
            These quotes are representative of public review-style feedback used for demo fallback.
          </div>
        )}

        {analysis ? (
          <>
            {/* Metric cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Reviews Analysed" value={String(analysis.total_reviews_analyzed ?? "—")} />
              <MetricCard label="Themes Found" value={String(analysis.themes?.length ?? 0)} />
              <MetricCard label="Negative Sentiment" value={`${analysis.sentiment_summary?.negative ?? 0}%`} highlight />
              <MetricCard label="Positive Sentiment" value={`${analysis.sentiment_summary?.positive ?? 0}%`} />
            </section>

            {/* Problem statement */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Problem Statement</h2>
              <p className="text-gray-800 leading-relaxed text-lg font-medium">{analysis.problem_statement}</p>
            </section>

            {/* 3-column info */}
            <section className="grid md:grid-cols-3 gap-5 mb-8">
              <InfoCard title="Summary" body={analysis.summary} />
              <InfoCard title="Target User Segment" body={analysis.target_user_segment} />
              <InfoCard title="Business Opportunity" body={analysis.business_opportunity} />
            </section>

            {/* Sentiment */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Sentiment Distribution</h2>
              <div className="space-y-4">
                <SentimentBar label="Positive" value={analysis.sentiment_summary?.positive ?? 0} color="green" />
                <SentimentBar label="Neutral" value={analysis.sentiment_summary?.neutral ?? 0} color="yellow" />
                <SentimentBar label="Negative" value={analysis.sentiment_summary?.negative ?? 0} color="red" />
              </div>
            </section>

            {/* Themes */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Themes & Pain Points</h2>
              <div className="space-y-5">
                {(analysis.themes ?? []).map((theme, i) => (
                  <ThemeCard key={i} theme={theme} rank={i + 1} />
                ))}
              </div>
            </section>

            {/* CTA to discovery */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
              <p className="text-lg font-semibold mb-1">Ready to address these pain points?</p>
              <p className="text-sm text-white/80 mb-4">
                The Discovery Agent lets users control mood, language, freshness, and avoid preferences — directly solving the issues surfaced above.
              </p>
              <Link href="/discovery" className="inline-block bg-white text-emerald-700 font-bold px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Try Discovery Agent →
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-xl font-semibold text-gray-800 mb-3">No analysis yet</p>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Run the Review Engine first to generate AI-powered themes and insights, or load the sample analysis to see what the dashboard looks like.
            </p>
            {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/reviews" className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Go to Review Engine
              </Link>
              <button onClick={handleLoadSample} disabled={loading}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer">
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
    <div className={`border rounded-2xl p-5 shadow-sm text-center ${highlight ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
      <p className={`text-3xl font-bold ${highlight ? "text-red-600" : "text-gray-900"}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-gray-700 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  const bar: Record<string, string> = {
    green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500",
  };
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1.5">
        <span>{label}</span><span className="font-medium">{value}%</span>
      </div>
      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ThemeCard({ theme, rank }: { theme: AnalysisTheme; rank: number }) {
  const [open, setOpen] = useState(true);
  const rankColors = ["bg-purple-600","bg-blue-600","bg-emerald-600","bg-orange-500","bg-pink-600"];
  const bg = rankColors[(rank - 1) % rankColors.length];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
        <span className={`${bg} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0`}>{rank}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{theme.theme_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{theme.count} reviews · {theme.pain_point}</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-4">{theme.description}</p>

          {theme.representative_quotes?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Public Review-Style Quotes
              </p>
              <ul className="space-y-2">
                {theme.representative_quotes.map((q, i) => (
                  <li key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-700 italic">
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full">
              <strong>Pain:</strong> {theme.pain_point}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full">
              <strong>Opportunity:</strong> {theme.opportunity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
