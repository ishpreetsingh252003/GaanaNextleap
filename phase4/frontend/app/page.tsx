"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { checkHealth } from "../lib/api";

type Status = "checking" | "ok" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  const badge = {
    checking: <span className="text-yellow-300 animate-pulse">● Checking…</span>,
    ok: <span className="text-green-400">✓ Backend connected (Phase 4)</span>,
    error: <span className="text-red-400">✗ Backend offline – run npm run dev in phase4/backend</span>,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-500 to-blue-600 text-white">
      <nav className="flex items-center justify-between px-8 py-4 text-white/80 text-sm">
        <span className="font-bold text-white text-lg">🎵 Gaana Discovery AI</span>
        <div className="flex gap-6">
          <Link href="/reviews" className="hover:text-white">Reviews</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="hover:text-white">Discovery</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Phase 4 – AI-Powered Music Discovery Agent
        </div>

        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Gaana Discovery AI</h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
          Scrapes Gaana user feedback from <strong>6 sources</strong>, analyzes it with AI,
          and provides personalized music recommendations based on your mood and preferences.
        </p>

        {/* Source chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: "🤖", label: "Google Play" },
            { icon: "🍎", label: "App Store" },
            { icon: "👽", label: "Reddit" },
            { icon: "💬", label: "Quora" },
            { icon: "🌐", label: "Web / News" },
            { icon: "🐦", label: "Twitter / X" },
          ].map((s) => (
            <span key={s.label} className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-full text-sm font-medium">
              {s.icon} {s.label}
            </span>
          ))}
        </div>

        {/* Status */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-lg mx-auto mb-10 text-sm">
          <p className="text-white/70 mb-1">Backend status</p>
          <p>{badge[status]}</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link href="/reviews" className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
            Start Scraping Reviews
          </Link>
          <Link href="/discovery" className="bg-green-500 hover:bg-green-400 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
            Try Discovery Agent
          </Link>
        </div>

        {/* Phase tracker */}
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { phase: "Phase 1", label: "Foundation", done: true },
            { phase: "Phase 2", label: "Scraping", done: true },
            { phase: "Phase 3", label: "AI Analysis", done: true },
            { phase: "Phase 4", label: "Discovery", done: true, active: true },
          ].map((p) => (
            <div key={p.phase} className={`rounded-xl p-4 border ${p.active ? "bg-white/25 border-white/50" : p.done ? "bg-white/15 border-white/30" : "bg-white/5 border-white/10"}`}>
              <p className="text-2xl">{p.done ? "✅" : "🔜"}</p>
              <p className="text-xs font-bold mt-1">{p.phase}</p>
              <p className="text-xs text-white/70">{p.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
