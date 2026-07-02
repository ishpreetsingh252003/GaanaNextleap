"use client";

import Link from "next/link";
import { getSources, scrapeReviews, analyzeReviews, SourceInfo, ReviewSource, ScrapeResponse, Review, BackendError } from "../../lib/api";
import { cleanReviews } from "../../lib/cleanReviews";
import { useState, useEffect, useRef } from "react";

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

const fallbackReviews: Review[] = [
  {
    id: "fallback-1",
    source: "google_play",
    rating: 2,
    title: "Repeats same songs constantly",
    text: "I am tired of listening to the same old songs. I love Hindi music, but the app keeps recommending the same 10 hits over and over. I want to discover new indie artists!",
    author: "Rahul S.",
    date: "2026-03-01T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-2",
    source: "app_store",
    rating: 1,
    title: "Recommendations feel stale",
    text: "The recommendations algorithm is broken. It does not matter if I choose chill or dance mood, it just plays the same viral Punjabi songs. Terrible discovery experience.",
    author: "Preeti K.",
    date: "2026-03-10T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-3",
    source: "reddit",
    rating: null,
    title: "Gaana's playlist fatigue is real",
    text: "Does anyone else feel like Gaana keeps playing the exact same tracklist? I try to find underrated indie or regional music but it constantly pushes mainstream Bollywood songs on my feed.",
    author: "music_lover_99",
    date: "2026-04-12T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-4",
    source: "google_play",
    rating: 3,
    title: "Needs better activity-based music",
    text: "It is decent, but I want Gym music that actually matches my pace, and Focus music that doesn't have annoying lyrics. Traditional recommendation is very poor at capturing my current context.",
    author: "Amit Verma",
    date: "2026-04-18T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-5",
    source: "quora",
    rating: null,
    title: "Why does Gaana recommend the same tracks?",
    text: "Traditional recommender systems rely on popularity bias. If a Bollywood track is trending, it will spam it to everyone's discovery list. This is why you get stuck in listening loops.",
    author: "Aditya Roy",
    date: "2026-05-01T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-6",
    source: "web_news",
    rating: null,
    title: "The problem with music streaming catalogs",
    text: "Users complain about repetitive loops on Gaana. Recommender systems struggle with the cold-start problem for emerging artists, meaning user discovery metrics are low.",
    author: "Tech India Blog",
    date: "2026-05-20T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-7",
    source: "google_play",
    rating: 2,
    title: "Fails to match mood",
    text: "I select Chill Hindi but it starts playing upbeat bhangra. Recommendation engine doesn't understand context or nuance.",
    author: "Sneha G.",
    date: "2026-06-05T00:00:00Z",
    url: null,
    lang: "en"
  },
  {
    id: "fallback-8",
    source: "app_store",
    rating: 2,
    title: "Bias towards mainstream",
    text: "Everything recommended is mainstream and viral. What if I want regional music that is niche? The algorithm forces hits upon us.",
    author: "Karthik R.",
    date: "2026-06-12T00:00:00Z",
    url: null,
    lang: "en"
  }
];

const fallbackAnalysis = {
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
  business_opportunity: "Addressing recommendation fatigue through controllable, AI-native music curation will increase active session lengths, improve user satisfaction, and surface long-tail indie/regional catalog content."
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
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    getSources()
      .then((data) => {
        setSources(data.sources);
        setSelected(data.sources.map((s) => s.id));
      })
      .catch(() => {
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
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function loadFallbackData() {
    setStatus("loading");
    setErrorMsg("");
    setTimeout(() => {
      const mockResponse = {
        success: true,
        total_reviews: fallbackReviews.length,
        date_range: { from: "2026-01-01", to: new Date().toISOString() },
        sources_summary: { google_play: 3, app_store: 2, reddit: 1, quora: 1, web_news: 1 } as any,
        reviews: fallbackReviews,
      };
      setResult(mockResponse);
      setAnalysis(fallbackAnalysis);
      sessionStorage.setItem("gaanaReviewAnalysis", JSON.stringify(fallbackAnalysis));
      setStatus("success");
      setCurrentPage(1);
    }, 800);
  }

  function parseCsvText(text: string): Review[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const titleIdx = headers.findIndex((h) => h.includes("title"));
    const textIdx = headers.findIndex((h) => h.includes("text") || h.includes("content") || h.includes("body"));
    const sourceIdx = headers.findIndex((h) => h.includes("source"));
    const ratingIdx = headers.findIndex((h) => h.includes("rating"));
    const authorIdx = headers.findIndex((h) => h.includes("author") || h.includes("name"));
    const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("time"));

    return lines.slice(1).map((line, idx) => {
      const cols = line.split(",");
      return {
        id: `csv-${idx}`,
        source: (cols[sourceIdx] || "unknown") as ReviewSource,
        rating: ratingIdx >= 0 ? Number(cols[ratingIdx]) || null : null,
        title: titleIdx >= 0 ? cols[titleIdx] : "",
        text: textIdx >= 0 ? cols[textIdx] : line,
        author: authorIdx >= 0 ? cols[authorIdx] : "unknown",
        date: dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString(),
        url: null,
        lang: "en",
      };
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    try {
      const text = await file.text();
      let uploaded: Review[] = [];
      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : json.reviews || [];
        uploaded = arr.map((r: any, idx: number) => ({
          id: r.id || `upload-${idx}`,
          source: (r.source || "unknown") as ReviewSource,
          rating: r.rating ?? null,
          title: r.title || "",
          text: r.text || "",
          author: r.author || "uploaded_user",
          date: r.date || new Date().toISOString(),
          url: r.url || null,
          lang: r.lang || "en",
        }));
      } else if (file.name.endsWith(".csv")) {
        uploaded = parseCsvText(text).filter((r) => r.text && r.text.length >= 5);
      } else {
        setCsvError("Unsupported file format. Please upload .csv or .json.");
        return;
      }

      if (uploaded.length === 0) {
        setCsvError("No valid reviews found in file.");
        return;
      }

      const cleaned = cleanReviews(uploaded);
      const scrapeResponse: ScrapeResponse = {
        success: true,
        total_reviews: cleaned.length,
        date_range: { from: "2026-01-01", to: new Date().toISOString() },
        sources_summary: { ...(result?.sources_summary || {}), unknown: cleaned.length } as any,
        reviews: cleaned,
      };
      setResult(scrapeResponse);
      setStatus("success");
      setCurrentPage(1);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      const message = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Scraping or analysis failed";
      setErrorMsg(message);
      setStatus("error");
    }
  }

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
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow" role="banner">
        <Link href="/" className="font-bold text-lg" aria-label="Gaana Discovery AI Home">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80" role="navigation" aria-label="Main navigation">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/reviews" className="text-white font-semibold border-b border-white" aria-current="page">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Review Engine</h1>
          <p className="text-gray-500 text-sm">
            Scrapes reviews from Google Play, App Store, Reddit, Quora, Web news, and Twitter — filtered to <strong>Jan 2026 → today</strong>.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm" aria-label="Source selection">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="font-semibold text-gray-800">Select Sources</h2>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setSelected(sources.map((s) => s.id))} className="text-purple-600 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded" type="button">
                Select all
              </button>
              <button onClick={() => setSelected([])} className="text-gray-400 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded" type="button">
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="group" aria-label="Available sources">
            {sources.map((src) => {
              const isOn = selected.includes(src.id);
              return (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  aria-pressed={isOn}
                  className={`flex items-center gap-2 border rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                    isOn ? SOURCE_COLORS[src.id] + " shadow-sm" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{SOURCE_ICONS[src.id]}</span>
                  <span>{src.label}</span>
                  {isOn && <span className="ml-auto text-xs" aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleScrape}
            disabled={status === "loading" || selected.length === 0}
            className="mt-5 w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
            aria-busy={status === "loading"}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-lg" aria-hidden="true">⏳</span>
                Scraping {selected.length} source{selected.length !== 1 ? "s" : ""}…
              </span>
            ) : (
              `🔍 Scrape ${selected.length} Source${selected.length !== 1 ? "s" : ""}`
            )}
          </button>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-500">Or upload file:</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">|</span>
            <button
              onClick={loadFallbackData}
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-3 py-2 rounded-lg border border-purple-200 transition-colors cursor-pointer self-start sm:self-auto"
              type="button"
            >
              💡 Load Fallback Public Reviews
            </button>
          </div>
          {csvError && (
            <p className="mt-2 text-xs text-red-600">{csvError}</p>
          )}

          {status === "loading" && (
            <p className="mt-3 text-center text-xs text-gray-400" role="status" aria-live="polite">
              This may take 30–90 seconds depending on sources selected. Please wait…
            </p>
          )}
        </section>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-red-700 text-sm" role="alert">
            <p className="font-semibold mb-2">⚠️ Scraping or analysis encountered an issue</p>
            <p className="mb-3 text-red-600">
              {errorMsg}. Live fetching may fail due to source restrictions. You can continue using fallback public review data or upload CSV.
            </p>
            <button
              onClick={loadFallbackData}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              type="button"
            >
              💡 Load Fallback Public Reviews & Run Analysis
            </button>
          </div>
        )}

        {status === "success" && result && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="Scrape summary">
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

            <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Reviews per Source</h2>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(result.sources_summary) as [ReviewSource, number][]).map(([src, count]) => (
                  <span
                    key={src}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${SOURCE_COLORS[src]}`}
                  >
                    {SOURCE_ICONS[src]} {sourceLabel(src)}: <strong>{count}</strong>
                  </span>
                ))}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg p-3" role="alert">
                  ⚠️ Some sources had issues:{" "}
                  {result.errors.map((e) => `${sourceLabel(e.source)} (${e.message})`).join(", ")}
                </div>
              )}
            </section>

            <section className="flex flex-col md:flex-row gap-3 mb-5">
              <label htmlFor="review-search" className="sr-only">Search reviews</label>
              <input
                id="review-search"
                type="text"
                placeholder="Search review text…"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Search review text"
              />
              <label htmlFor="source-filter" className="sr-only">Filter by source</label>
              <select
                id="source-filter"
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value as ReviewSource | "all"); setCurrentPage(1); }}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                aria-label="Filter reviews by source"
              >
                <option value="all">All sources</option>
                {(Object.keys(result.sources_summary) as ReviewSource[]).map((src) => (
                  <option key={src} value={src}>{sourceLabel(src)}</option>
                ))}
              </select>
              <span className="self-center text-sm text-gray-400 whitespace-nowrap" aria-live="polite">
                {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
              </span>
            </section>

            <section className="space-y-3 mb-6" aria-label="Review list">
              {paginatedReviews.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400" role="status">
                  No reviews match your filter.
                </div>
              ) : (
                paginatedReviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </section>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mb-8" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  aria-label="Previous page"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500" aria-current="page">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  aria-label="Next page"
                >
                  Next →
                </button>
              </nav>
            )}

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white text-center animate-fade-in">
              <p className="text-lg font-semibold mb-1">Ready to analyse these reviews?</p>
              <p className="text-sm text-white/80 mb-4">
                The AI engine will analyze these {result.total_reviews} reviews to extract themes, pain points, sentiment, and opportunities.
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
    <article className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SOURCE_COLORS[review.source]}`}>
            {SOURCE_ICONS[review.source]} {sourceLabel(review.source)}
          </span>
          {review.rating !== null && (
            <span className="text-xs text-yellow-600 font-medium" aria-label={`Rating: ${review.rating} out of 5`}>
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          )}
        </div>
        <time className="text-xs text-gray-400 shrink-0" dateTime={review.date}>
          {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </time>
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
          className="text-xs text-purple-600 mt-1 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
          aria-expanded={expanded}
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
            className="text-xs text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Source ↗
          </a>
        )}
      </div>
    </article>
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
