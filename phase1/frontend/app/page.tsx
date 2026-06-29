"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { checkHealth } from "@/lib/api";

type BackendStatus = "checking" | "connected" | "error";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    (async () => {
      try {
        await checkHealth();
        setBackendStatus("connected");
      } catch {
        setBackendStatus("error");
      }
    })();
  }, []);

  const statusBadge = {
    checking: (
      <span className="inline-flex items-center gap-1 text-yellow-300">
        <span className="animate-pulse">●</span> Checking…
      </span>
    ),
    connected: (
      <span className="inline-flex items-center gap-1 text-green-400">
        ✓ Connected
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-1 text-red-400">
        ✗ Disconnected – start the backend server
      </span>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-4 text-white/80 text-sm">
        <span className="font-bold text-white text-lg tracking-tight">
          🎵 Gaana Discovery AI
        </span>
        <div className="flex gap-6">
          <Link href="/reviews" className="hover:text-white transition-colors">
            Reviews
          </Link>
          <Link
            href="/discovery"
            className="hover:text-white transition-colors"
          >
            Discovery
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="container mx-auto px-4 py-16 text-white text-center">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
          Gaana Discovery AI
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
          Discover fresh but relevant music based on your mood, language,
          activity, and freshness preference.
        </p>

        {/* ── Product flow ── */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-10 max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">The Product Flow</h2>
          <div className="flex flex-wrap justify-center items-center gap-3 text-sm font-medium">
            {[
              "📝 Public Reviews",
              "→",
              "🤖 AI Analysis",
              "→",
              "😤 User Pain Points",
              "→",
              "🎵 Discovery MVP",
            ].map((step, i) => (
              <span
                key={i}
                className={
                  step === "→"
                    ? "text-white/50"
                    : "bg-white/20 px-3 py-1 rounded-full"
                }
              >
                {step}
              </span>
            ))}
          </div>

          <p className="mt-6 text-sm text-white/70">
            Backend status: {statusBadge[backendStatus]}
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link
            href="/reviews"
            className="bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg"
          >
            Analyze Reviews
          </Link>
          <Link
            href="/discovery"
            className="bg-green-500 hover:bg-green-400 active:bg-green-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg"
          >
            Try Discovery Agent
          </Link>
        </div>

        {/* ── Phase indicators ── */}
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { phase: "Phase 1", label: "Foundation", status: "✅", active: true },
            { phase: "Phase 2", label: "Review Pipeline", status: "🔜", active: false },
            { phase: "Phase 3", label: "AI Analysis", status: "🔜", active: false },
            { phase: "Phase 4", label: "Discovery Agent", status: "🔜", active: false },
          ].map((p) => (
            <div
              key={p.phase}
              className={`rounded-xl p-4 border ${
                p.active
                  ? "bg-white/20 border-white/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <p className="text-2xl">{p.status}</p>
              <p className="text-xs font-bold mt-1">{p.phase}</p>
              <p className="text-xs text-white/70">{p.label}</p>
            </div>
          ))}
        </div>

        <Link href="/about" className="text-blue-200 hover:text-white text-sm transition-colors underline underline-offset-2">
          View Limitations &amp; Scope →
        </Link>
      </main>
    </div>
  );
}
