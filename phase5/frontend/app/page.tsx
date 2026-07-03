"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { checkHealth, BackendError } from "../lib/api";

type Status = "checking" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");
  const [retryCount, setRetryCount] = useState(0);

  const checkBackend = useCallback(async () => {
    try {
      await checkHealth();
      setStatus("ok");
    } catch (err) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    checkBackend();
    if (status === "error" && retryCount < 2) {
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        checkBackend();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [checkBackend, retryCount, status]);

  const badge = {
    checking: (
      <span className="inline-flex items-center gap-2 text-yellow-300 animate-pulse">
        <span className="w-2 h-2 bg-yellow-300 rounded-full" />
        Checking backend status…
      </span>
    ),
    ok: (
      <span className="inline-flex items-center gap-2 text-green-400">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        Backend API Connected
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-2 text-red-400">
        <span className="w-2 h-2 bg-red-400 rounded-full" />
        Backend API Offline
        {retryCount >= 2 && (
          <span className="text-red-300 text-xs"> (retry failed)</span>
        )}
      </span>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 text-white/80 text-sm bg-black/20 backdrop-blur-sm sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <Link href="/" className="font-bold text-white text-lg tracking-tight flex items-center gap-2" aria-label="Gaana Discovery AI Home">
          <span className="text-2xl">🎵</span>
          <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">Gaana Discovery AI</span>
        </Link>
        <div className="flex gap-3 sm:gap-5 text-xs sm:text-sm">
          <Link href="/" className="text-white font-semibold border-b-2 border-red-500">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 sm:py-16">
        {/* Search-style hero bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search mood, artist, language, or vibe"
              className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
              readOnly
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
          </div>
        </div>

        {/* Main title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Gaana Discovery AI
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Fresh music discovery powered by public user feedback
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <Link
            href="/reviews"
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
          >
            Analyze Reviews
          </Link>
          <Link
            href="/discovery"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-full font-bold transition-all backdrop-blur-sm hover:-translate-y-0.5"
          >
            Try Discovery Agent
          </Link>
        </div>

        {/* Large playlist-style hero card */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-lg flex-shrink-0">
                🎧
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Fresh but Relevant Mix</h2>
                <p className="text-sm text-white/70 mb-4">AI-curated discovery based on real user feedback</p>
                <div className="flex flex-wrap gap-2">
                  {["Hindi", "Punjabi", "Gym", "Travel", "Romantic", "Fresh"].map((tag) => (
                    <span key={tag} className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product flow cards */}
        <div className="max-w-4xl mx-auto mb-10">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 text-center">How It Works</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "📡", label: "Public Reviews", desc: "Scrape feedback" },
              { icon: "🧠", label: "AI Analysis", desc: "Extract themes" },
              { icon: "⚠️", label: "Pain Points", desc: "Identify issues" },
              { icon: "🤖", label: "Discovery Agent", desc: "Generate picks" },
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
                <span className="text-2xl sm:text-3xl block mb-2">{step.icon}</span>
                <p className="text-xs sm:text-sm font-semibold mb-1">{step.label}</p>
                <p className="text-xs text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal music-style sections */}
        <div className="max-w-6xl mx-auto space-y-8 mb-10">
          <Section title="Top Discovery Problems" items={[
            "Repetitive recommendations",
            "Mainstream content dominance",
            "Mood/context mismatch",
            "Regional discovery gaps",
          ]} />
          <Section title="Moods & Languages" items={[
            "Chill • Sad • Party • Gym",
            "Hindi • Punjabi • Tamil • Telugu",
            "Bhojpuri • English • Mixed",
          ]} />
          <Section title="Fresh For You" items={[
            "Underrated indie tracks",
            "Emerging regional artists",
            "Activity-specific playlists",
            "Freshness-controlled discovery",
          ]} />
        </div>

        {/* Problem statement card */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Problem Statement</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              "Young Indian music listeners often fall back to familiar playlists, artists, and tracks because discovering fresh but still relevant music takes effort."
            </p>
          </div>
        </div>

        {/* Review-led validation */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3">Review-Led Validation Approach</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Because direct interviews were not included in this version, the opportunity was validated through public user feedback analysis. Reviews and online discussions were treated as real usage signals to identify repeated discovery pain points.
            </p>
          </div>
        </div>

        {/* Data sources */}
        <div className="max-w-3xl mx-auto mb-10">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 text-center">Data Sources</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: "🤖", label: "Google Play" },
              { icon: "🍎", label: "App Store" },
              { icon: "👽", label: "Reddit" },
              { icon: "💬", label: "Quora" },
              { icon: "🌐", label: "Web & News" },
              { icon: "🐦", label: "Twitter / X" },
            ].map((s) => (
              <span
                key={s.label}
                className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-6 py-2 text-xs text-white/70">
            {badge[status]}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></span>
        {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, i) => (
          <div key={i} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer">
            <p className="text-xs sm:text-sm text-white/80">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
