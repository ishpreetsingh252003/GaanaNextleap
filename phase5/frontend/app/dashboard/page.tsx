"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const sampleAnalysis = {
  summary: "Users are highly frustrated by repetitive recommendations and popularity bias. There is a strong, consistent demand for fresh indie/regional tracks, context-aware suggestions (gym, focus, sleep), and user-guided discovery control.",
  total_reviews_analyzed: 8,
  date_range: "2026-01-01 to 2026-07-02",
  themes: [
    {
      theme_name: "Repetitive Recommendations & Playlist Fatigue",
      count: 5,
      description: "Users repeatedly report getting recommended the same familiar tracks and artists, leading to repetitive listening loop frustration.",
      pain_point: "Inability to escape repetitive loops; staleness of recommendation feed.",
      representative_quotes: [
        "I am tired of listening to the same old songs. I love Hindi music, but the app keeps recommending the same 10 hits over and over.",
        "The recommendations algorithm is broken. It does not matter if I choose chill or dance mood, it just plays the same viral Punjabi songs."
      ],
      opportunity: "Provide active discovery parameters that filter out already played tracks."
    },
    {
      theme_name: "Niche & Regional Music Neglect",
      count: 3,
      description: "Standard algorithms favor mainstream popularity and viral hits, crowding out regional or niche artists.",
      pain_point: "Low visibility for regional languages and non-mainstream artists.",
      representative_quotes: [
        "I try to find underrated indie or regional music but it constantly pushes mainstream Bollywood songs on my feed.",
        "Everything recommended is mainstream and viral. What if I want regional music that is niche?"
      ],
      opportunity: "Create regional-first search filters and support active discovery of long-tail artists."
    },
    {
      theme_name: "Inaccurate Context and Mood Matching",
      count: 2,
      description: "Algorithms fail to match recommendations to the user's specific context, activity, or mood.",
      pain_point: "Mismatched tempos or themes (e.g. playing slow sad songs during workouts).",
      representative_quotes: [
        "I select Chill Hindi but it starts playing upbeat bhangra.",
        "I want Gym music that actually matches my pace, and Focus music that doesn't have annoying lyrics."
      ],
      opportunity: "Implement user-controllable preferences mapping tempo, activity, and mood dynamically."
    }
  ],
  sentiment_summary: {
    positive: 10,
    neutral: 25,
    negative: 65
  },
  target_user_segment: "Young Indian listeners (18-30) who are digitally savvy, open to diverse genres and regional languages, but feel constrained by mainstream popularity filters.",
  problem_statement: "Gaana listeners fall into repetitive listening loops because the recommendation system prioritizes familiarity and viral popularity. This restricts discovery of fresh, niche, and activity-appropriate tracks.",
  business_opportunity: "Addressing recommendation fatigue through controllable, AI-native music curation will increase active session lengths, improve user satisfaction, and surface long-tail indie/regional catalog content.",
  is_sample: true
};

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

  function loadSampleAnalysis() {
    sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(sampleAnalysis));
    setAnalysis(sampleAnalysis);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow" role="banner">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80" role="navigation" aria-label="Main navigation">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="text-white font-semibold border-b border-white" aria-current="page">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Analysis Dashboard</h1>
          <p className="text-gray-500">AI summary generated from scraped user reviews and feedback signals.</p>
        </div>

        {analysis && analysis.is_sample && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl text-amber-800 text-xs">
            <strong>💡 Fallback/Sample Public Review Analysis loaded.</strong> This data is pre-generated for demo purposes to represent common review frustrations.
          </div>
        )}

        {analysis ? (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-label="Analysis metrics">
              <MetricCard label="Reviews Analysed" value={analysis.total_reviews_analyzed?.toString() ?? "—"} />
              <MetricCard label="Themes" value={(analysis.themes?.length ?? 0).toString()} />
              <MetricCard label="Sentiment Score" value={`+${analysis.sentiment_summary?.positive ?? 0}%`} />
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
                <div className="space-y-4">
                  <SentimentBar label="Positive" value={analysis.sentiment_summary?.positive ?? 0} color="green" />
                  <SentimentBar label="Neutral" value={analysis.sentiment_summary?.neutral ?? 0} color="yellow" />
                  <SentimentBar label="Negative" value={analysis.sentiment_summary?.negative ?? 0} color="red" />
                </div>
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
            <p className="text-lg font-semibold text-gray-800 mb-4">No analysis generated yet</p>
            <p className="text-gray-500 mb-6">
              Run the Review Engine first to generate AI-powered themes, pain points, quotes, and opportunity areas from public user feedback.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/reviews" className="inline-block bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Go to Review Engine
              </Link>
              <button
                onClick={loadSampleAnalysis}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer"
                type="button"
              >
                💡 Load Sample Analysis
              </button>
            </div>
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
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden" role="img" aria-label={`${label} sentiment: ${value}%`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === "green" ? "bg-emerald-500" : color === "yellow" ? "bg-amber-400" : "bg-red-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: any }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <p className="text-sm font-semibold text-gray-800 mb-1">{theme.theme_name}</p>
      <p className="text-xs text-gray-500 mb-2">{theme.count} reviews</p>
      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Pain point:</strong> {theme.pain_point}</p>
        <p><strong>Opportunity:</strong> {theme.opportunity}</p>
      </div>
      {theme.representative_quotes && theme.representative_quotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-2">Representative Quotes:</p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {theme.representative_quotes.map((q: string, idx: number) => (
              <li key={idx}>&ldquo;{q}&rdquo;</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
