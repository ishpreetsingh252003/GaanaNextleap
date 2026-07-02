"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { checkHealth, BackendError } from "../lib/api";

type Status = "checking" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkBackend = useCallback(async () => {
    try {
      const data = await checkHealth();
      setBackendVersion(String(data.phase));
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
        <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse-slow" />
        Checking backend…
      </span>
    ),
    ok: (
      <span className="inline-flex items-center gap-2 text-green-400">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        Backend connected — Phase {backendVersion ?? "?"} ready
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-2 text-red-400">
        <span className="w-2 h-2 bg-red-400 rounded-full" />
        Backend offline — run `npm run dev` in phase5/backend
        {retryCount >= 2 && (
          <span className="text-red-300 text-xs"> (auto-retry attempted)</span>
        )}
      </span>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-500 to-blue-600 text-white">
      <nav className="flex items-center justify-between px-6 py-4 text-white/80 text-sm" role="navigation" aria-label="Main navigation">
        <Link href="/" className="font-bold text-white text-lg tracking-tight" aria-label="Gaana Discovery AI Home">
          🎵 Gaana Discovery AI
        </Link>
        <div className="flex gap-4 sm:gap-6">
          <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Phase 5 — Graduation Demo
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Gaana Discovery AI
        </h1>
        <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto text-white/90 leading-relaxed">
          Scrapes Gaana user feedback from <strong>6 sources</strong>, analyzes it with AI,
          and delivers personalized music recommendations tuned to your mood and preferences.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: "🤖", label: "Google Play" },
            { icon: "🍎", label: "App Store" },
            { icon: "👽", label: "Reddit" },
            { icon: "💬", label: "Quora" },
            { icon: "🌐", label: "Web / News" },
            { icon: "🐦", label: "Twitter / X" },
          ].map((s) => (
            <span
              key={s.label}
              className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              {s.icon} {s.label}
            </span>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-lg mx-auto mb-10 text-sm">
          <p className="text-white/70 mb-1 text-xs uppercase tracking-wider font-semibold">Backend Status</p>
          <p className="text-base">{badge[status]}</p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-14">
          <Link
            href="/reviews"
            className="bg-white text-purple-700 hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Scraping Reviews
          </Link>
          <Link
            href="/discovery"
            className="bg-green-500 hover:bg-green-400 text-white px-6 sm:px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Try Discovery Agent
          </Link>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { phase: "Phase 1", label: "Foundation", done: true, active: false },
            { phase: "Phase 2", label: "Scraping", done: true, active: false },
            { phase: "Phase 3", label: "AI Analysis", done: true, active: false },
            { phase: "Phase 4", label: "Discovery", done: true, active: false },
            { phase: "Phase 5", label: "Graduation", done: true, active: true },
          ].map((p, idx) => (
            <div
              key={p.phase}
              className={`rounded-xl p-4 border transition-all ${
                p.active
                  ? "bg-white/25 border-white/50 shadow-lg scale-105"
                  : p.done
                    ? "bg-white/15 border-white/30"
                    : "bg-white/5 border-white/10"
              }`}
            >
              <p className="text-2xl mb-1">{p.done ? "✅" : "🔜"}</p>
              <p className="text-xs font-bold">{p.phase}</p>
              <p className="text-xs text-white/70">{p.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/80 backdrop-blur-sm">
          <span className="text-green-400">●</span>
          Production Ready <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-semibold">v5.0.0</span>
        </div>
      </main>
    </div>
  );
}
