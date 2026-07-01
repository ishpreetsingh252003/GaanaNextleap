"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<any | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("gaanaReviewAnalysis");
    if (stored) {
      try {
        setAnalysis(JSON.parse(stored));
      } catch {
        setAnalysis(null);
      }
    }
  }, []);

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

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Phase 3 – Review Analysis
          </span>
          <h1 className="text-3xl font-bold mt-3 mb-2">Review Analysis Dashboard</h1>
          <p className="text-gray-500">
            This page shows the AI summary generated from scraped review data.
          </p>
        </div>

        {analysis ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Reviews Analysed" value={analysis.total_reviews_analyzed?.toString() ?? "—"} />
              <MetricCard label="Themes" value={(analysis.themes?.length ?? 0).toString()} />
              <MetricCard label="Sentiment" value={`+${analysis.sentiment_summary?.positive ?? 0}%`} />
              <MetricCard label="Target Segment" value={analysis.target_user_segment ? "Ready" : "—"} />
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Problem Statement</h2>
              <p className="text-gray-700 leading-relaxed">{analysis.problem_statement || "No problem statement available."}</p>
            </section>

            <section className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Target Segment</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.target_user_segment || "Not available."}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Opportunity</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.business_opportunity || "Not available."}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.summary || "Not available."}</p>
              </div>
            </section>

            <section className="grid gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Sentiment</h2>
                <SentimentBar label="Positive" value={analysis.sentiment_summary?.positive ?? 0} color="green" />
                <SentimentBar label="Neutral" value={analysis.sentiment_summary?.neutral ?? 0} color="yellow" />
                <SentimentBar label="Negative" value={analysis.sentiment_summary?.negative ?? 0} color="red" />
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Themes</h2>
                <div className="space-y-4">
                  {analysis.themes?.length ? (
                    analysis.themes.map((theme: any, index: number) => (
                      <ThemeCard key={index} theme={theme} />
                    ))
                  ) : (
                    <p className="text-gray-500">No themes found.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
            <p className="text-lg font-semibold text-gray-800 mb-4">No analysis available yet.</p>
            <p className="text-gray-500 mb-6">
              Scrape reviews first on the Reviews page, then return here to see AI analysis results.
            </p>
            <Link href="/reviews" className="inline-block bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold">
              Go scrape reviews
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color === "green" ? "bg-emerald-500" : color === "yellow" ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: any }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
      <p className="text-sm font-semibold text-gray-800 mb-1">{theme.theme_name}</p>
      <p className="text-xs text-gray-500 mb-2">{theme.count} reviews</p>
      <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Pain point:</strong> {theme.pain_point}</p>
        <p><strong>Opportunity:</strong> {theme.opportunity}</p>
      </div>
    </div>
  );
}
