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
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-500 to-blue-600 text-white">
      <nav className="flex items-center justify-between px-6 py-4 text-white/80 text-sm" role="navigation" aria-label="Main navigation">
        <Link href="/" className="font-bold text-white text-lg tracking-tight" aria-label="Gaana Discovery AI Home">
          🎵 Gaana Discovery AI
        </Link>
        <div className="flex gap-4 sm:gap-6">
          <Link href="/" className="text-white font-semibold">Home</Link>
          <Link href="/reviews" className="hover:text-white transition-colors">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white transition-colors">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Gaana Discovery AI
        </h1>
        <p className="text-lg sm:text-xl mb-4 max-w-2xl mx-auto text-white/95 leading-relaxed font-medium">
          Review-led AI music discovery for fresh but relevant listening
        </p>
        
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto mb-8 text-left">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-2">Problem Statement</h2>
          <p className="text-sm leading-relaxed text-white/90">
            “Young Indian music listeners often fall back to familiar playlists, artists, and tracks because discovering fresh but still relevant music takes effort.”
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto mb-8 text-left">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-3">Product Flow</h2>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="block text-lg mb-1">📡</span>
              Public Reviews
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="block text-lg mb-1">🧠</span>
              AI Review Analysis
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="block text-lg mb-1">⚠️</span>
              Discovery Pain Points
            </div>
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <span className="block text-lg mb-1">🤖</span>
              AI Discovery Agent
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <Link
            href="/reviews"
            className="bg-white text-purple-700 hover:bg-gray-100 px-6 sm:px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Analyze Reviews
          </Link>
          <Link
            href="/discovery"
            className="bg-green-500 hover:bg-green-400 text-white px-6 sm:px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Try Discovery Agent
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto mb-10 text-left">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-white/70 mb-2">Review-led Validation Approach</h2>
          <p className="text-xs leading-relaxed text-white/80">
            Because direct interviews were not included in this version, the opportunity was validated through public user feedback analysis. Reviews and online discussions were treated as real usage signals to identify repeated discovery pain points.
          </p>
        </div>

        <div className="flex justify-center gap-2 flex-wrap mb-10">
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
              className="bg-white/10 border border-white/25 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm text-white/90"
            >
              {s.icon} {s.label}
            </span>
          ))}
        </div>

        <div className="bg-black/10 backdrop-blur border border-white/10 rounded-full px-6 py-2 max-w-xs mx-auto text-xs text-white/70">
          {badge[status]}
        </div>
      </main>
    </div>
  );
}
