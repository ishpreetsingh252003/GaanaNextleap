"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  generateRecommendations, DiscoveryPreferences, RecommendationCard, BackendError,
} from "../../lib/api";

const MOODS = ["Chill","Sad","Party","Gym","Travel","Focus","Romantic","Energetic"] as const;
const LANGUAGES = ["Hindi","Punjabi","Tamil","Telugu","Bhojpuri","English","Mixed"] as const;
const ACTIVITIES = ["Studying","Travelling","Gym","Late night","Party","Work","Relaxing"] as const;
const AVOID_OPTIONS = [
  { value: "avoid_repeated_artists", label: "Avoid repeated artists" },
  { value: "avoid_mainstream",       label: "Avoid mainstream / viral hits" },
  { value: "avoid_overplayed",       label: "Avoid overplayed tracks" },
  { value: "avoid_sad",              label: "Avoid sad / melancholic tracks" },
  { value: "avoid_slow",             label: "Avoid slow-tempo songs" },
];

const DEMO_EXAMPLES = [
  "Punjabi gym songs like Sidhu Moose Wala but not the same viral tracks",
  "Hindi late-night romantic songs but not Arijit again",
  "Fresh Tamil travel songs, upbeat but not too experimental",
  "Bhojpuri party songs, more regional and less mainstream",
];

const FRESHNESS_DESC: Record<string, string> = {
  Safe:     "Popular hits — familiar and well-loved",
  Balanced: "Mix of known and emerging tracks",
  Fresh:    "New releases, underrated gems, emerging artists",
};

function freshnessFromValue(value: number) {
  if (value <= 35) return "Safe";
  if (value <= 70) return "Balanced";
  return "Fresh";
}

function valueForFreshness(value: string) {
  if (value === "Safe") return 25;
  if (value === "Fresh") return 85;
  return 60;
}

const LOAD_STEPS = [
  "Reading your preferences…",
  "Exploring Indian music catalog…",
  "Matching mood, language, and activity…",
  "Curating fresh recommendations…",
  "Refining results based on your avoid preferences…",
  "Almost ready…",
];

type Status = "idle" | "loading" | "success" | "error";

export default function DiscoveryPage() {
  return (
    <Suspense fallback={<DiscoveryLoading />}>
      <DiscoveryContent />
    </Suspense>
  );
}

function DiscoveryContent() {
  const searchParams = useSearchParams();
  const [mood, setMood]         = useState("");
  const [language, setLanguage] = useState("");
  const [activity, setActivity] = useState("");
  const [freshnessValue, setFreshnessValue] = useState(60);
  const [freshness, setFreshness] = useState("Balanced");
  const [reference, setReference] = useState("");
  const [avoidList, setAvoidList] = useState<string[]>([]);
  const [status, setStatus]     = useState<Status>("idle");
  const [loadStep, setLoadStep] = useState(0);
  const [recs, setRecs]         = useState<RecommendationCard[]>([]);
  const [explanation, setExplanation] = useState("");
  const [queryUsed, setQueryUsed] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function resetOptionalFilters() {
    setMood("");
    setLanguage("");
    setActivity("");
    setAvoidList([]);
    setFreshness("Balanced");
    setFreshnessValue(60);
  }

  function handleReferenceChange(value: string) {
    setReference(value);
    if (value.trim() === "") {
      resetOptionalFilters();
      setRecs([]);
      setExplanation("");
      setQueryUsed("");
      setReferenceNote("");
      setStatus("idle");
      setErrorMsg("");
    }
  }

  function updateFreshness(value: number) {
    setFreshnessValue(value);
    setFreshness(freshnessFromValue(value));
  }

  function toggleAvoid(v: string) {
    setAvoidList((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }

  function prefillDemo(example: string) {
    const lower = example.toLowerCase();
    setReference(example);
    if (lower.includes("punjabi")) setLanguage("Punjabi");
    else if (lower.includes("hindi")) setLanguage("Hindi");
    else if (lower.includes("tamil")) setLanguage("Tamil");
    else if (lower.includes("bhojpuri")) setLanguage("Bhojpuri");
    if (lower.includes("gym")) { setMood("Gym"); setActivity("Gym"); }
    else if (lower.includes("late-night") || lower.includes("late night")) { setMood("Romantic"); setActivity("Late night"); }
    else if (lower.includes("travel")) { setMood("Travel"); setActivity("Travelling"); }
    else if (lower.includes("party")) { setMood("Party"); setActivity("Party"); }
    if (lower.includes("fresh") || lower.includes("new") || lower.includes("not the same viral")) {
      setFreshness("Fresh");
      setFreshnessValue(85);
    } else {
      setFreshness("Balanced");
      setFreshnessValue(60);
    }
    if (lower.includes("not the same") || lower.includes("not arijit")) setAvoidList(["avoid_repeated_artists","avoid_overplayed"]);
    else if (lower.includes("mainstream") || lower.includes("less mainstream")) setAvoidList(["avoid_mainstream"]);
  }

  function startTicker() {
    setLoadStep(0);
    let s = 0;
    const iv = setInterval(() => {
      s = Math.min(s + 1, LOAD_STEPS.length - 1);
      setLoadStep(s);
    }, 3500);
    return iv;
  }

  const runGenerate = useCallback(async (overrides?: Partial<DiscoveryPreferences>) => {
    const nextReference = overrides?.reference !== undefined ? overrides.reference : reference || undefined;
    const prefs: DiscoveryPreferences = {
      query: overrides?.query ?? nextReference,
      mood: overrides?.mood ?? mood,
      language: overrides?.language ?? language,
      activity: overrides?.activity ?? activity,
      freshness: overrides?.freshness ?? freshness,
      reference: nextReference,
      avoid: overrides?.avoid ?? avoidList,
      refineAction: overrides?.refineAction,
    };

    if (!prefs.query && !prefs.mood && !prefs.language && !prefs.activity) {
      setErrorMsg("Start with a song, artist, mood, language, or pick a refinement.");
      return;
    }

    // Sync state so UI reflects what was sent
    if (overrides?.mood)      setMood(overrides.mood);
    if (overrides?.freshness) {
      setFreshness(overrides.freshness);
      setFreshnessValue(valueForFreshness(overrides.freshness));
    }
    if (overrides?.avoid)     setAvoidList(overrides.avoid);

    setStatus("loading"); setErrorMsg(""); setRecs([]);
    const ticker = startTicker();
    try {
      const data = await generateRecommendations(prefs);
      clearInterval(ticker);
      setRecs(data.recommendations ?? []);
      setExplanation(data.explanation ?? "");
      setQueryUsed(data.query_used ?? "");
      setIsFallback(data.is_fallback ?? false);
      const uiPreferences = data.ui_preferences;
      if (uiPreferences) {
        setMood(uiPreferences.mood ?? "");
        setLanguage(uiPreferences.language ?? "");
        setActivity(uiPreferences.activity ?? "");
        if (uiPreferences.freshness) {
          setFreshness(uiPreferences.freshness);
          setFreshnessValue(valueForFreshness(uiPreferences.freshness));
        }
        setReferenceNote(
          uiPreferences.queryType === "reference" && (uiPreferences.reference || prefs.reference)
            ? `Using "${uiPreferences.reference || prefs.reference}" as a reference point for fresh discovery.`
            : ""
        );
      }
      setStatus("success");
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Failed to generate recommendations";
      setErrorMsg(msg); setStatus("error");
    }
  }, [mood, language, activity, freshness, reference, avoidList]);

  useEffect(() => {
    const urlQuery = searchParams.get("query")?.trim();
    if (urlQuery) setReference(urlQuery);
  }, [searchParams]);

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
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/discovery" className="text-white font-semibold border-b-2 border-red-500">Fresh Finds</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Fresh Finds by Gaana</h1>
          <p className="text-white/60 text-sm">
            Find songs that feel new, not random.
          </p>
        </div>

        {/* Big search/prompt bar */}
        <div className="mb-6">
          <label htmlFor="discovery-query" className="text-sm font-semibold text-white mb-2 block">
            Start with a song, artist, mood, or language
          </label>
          <div className="relative">
            <input
              id="discovery-query"
              type="text"
              value={reference}
              onChange={(e) => handleReferenceChange(e.target.value)}
              placeholder="Arijit Singh for late-night Hindi songs, but fresher"
              className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-4 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Fresh Finds uses your input as a reference point and expands it into music that feels fresh, not random.
          </p>
        </div>

        {/* Demo examples */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">Try a demo query</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => prefillDemo(ex)}
                className="text-xs bg-white/10 border border-white/20 text-white/80 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 gap-5 mb-5">
          <FormCard label="Refine your mix">
            <p className="text-xs text-white/50 mb-4">Optional — use these only if you want more control.</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Mood</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button key={m} onClick={() => setMood(m)} type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${mood === m ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Language</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button key={l} onClick={() => setLanguage(l)} type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${language === l ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Activity</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITIES.map((a) => (
                    <button key={a} onClick={() => setActivity(a)} type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${activity === a ? "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-500" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          <FormCard label="Freshness">
            <p className="text-xs text-white/50 mb-4">Control how new or familiar the recommendations should feel.</p>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="100"
                value={freshnessValue}
                onChange={(e) => updateFreshness(Number(e.target.value))}
                className="w-full accent-red-500"
                aria-label="Freshness"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>Familiar</span>
                <span>Balanced</span>
                <span>Fresh</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm font-semibold text-white">{freshness}</p>
                <p className="text-xs text-white/40">{freshnessValue}/100</p>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-2">{FRESHNESS_DESC[freshness]}</p>
          </FormCard>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          <FormCard label="Reference artist or song (optional)">
            <input type="text" value={reference} onChange={(e) => handleReferenceChange(e.target.value)}
              placeholder="e.g. Sidhu Moose Wala, Arijit Singh, 'Kesariya'"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 backdrop-blur-sm" />
            <p className="text-xs text-white/40 mt-1.5">We'll find similar vibe — not the exact same songs.</p>
          </FormCard>

          <FormCard label="Avoid preferences">
            <div className="flex flex-wrap gap-2">
              {AVOID_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => toggleAvoid(opt.value)} type="button"
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${avoidList.includes(opt.value) ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </FormCard>
        </div>

        <button onClick={() => runGenerate()} disabled={status === "loading"}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3">
          {status === "loading"
            ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span>{LOAD_STEPS[loadStep]}</span>
            : "Generate Discovery Mix"}
        </button>

        {referenceNote && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/70 mb-4">
            {referenceNote}
          </div>
        )}

        <p className="text-xs text-white/40 text-center mb-6">
          This MVP uses publicly available music metadata and AI inference for demonstration.
          It does not represent Gaana&apos;s full internal catalog.
        </p>

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-sm backdrop-blur-sm" role="alert">
            <p className="font-semibold text-red-400 mb-1">⚠️ Generation issue</p>
            <p className="text-red-300">{errorMsg}</p>
            <p className="text-white/50 text-xs mt-2">
              Recommendations are temporarily unavailable. Try again in a moment or adjust your query.
            </p>
          </div>
        )}

        {status === "success" && recs.length > 0 && (
          <div className="mt-2">
            {isFallback && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-5 rounded-r-xl text-xs text-amber-300 backdrop-blur-sm">
                <strong>💡 Demo fallback recommendations shown.</strong>{" "}
                AI generation was temporarily unavailable. These results are from the sample public music metadata catalog and represent realistic discovery picks for your preferences.
              </div>
            )}

            {/* Mini-player-inspired visual bar */}
            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-4 mb-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-xl shrink-0">
                🎧
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Now discovering: {reference || language || mood || "Fresh Finds"} Mix</p>
                <p className="text-xs text-white/60">{recs.length} tracks • {freshness} freshness</p>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60">⏮</span>
                <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60">⏭</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-5 text-white mb-5 shadow-lg shadow-red-500/25">
              <h2 className="font-bold text-lg mb-1">🎵 {recs.length} Recommendations Ready</h2>
              <p className="text-white/90 text-sm">{explanation}</p>
              {queryUsed && <p className="text-white/70 text-xs mt-2 italic">Query: {queryUsed}</p>}
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <QuickAction label="🔥 More Fresh" onClick={() => runGenerate({ freshness: "Fresh", avoid: [...new Set([...avoidList,"avoid_overplayed","avoid_mainstream"])] })} />
              <QuickAction label="🎯 More Familiar" onClick={() => runGenerate({ freshness: "Safe" })} />
              <QuickAction label="🌍 More Regional" onClick={() => {
                const regional = ["Hindi","Punjabi","Tamil","Telugu","Bhojpuri"].find((l) => l !== language) ?? "Punjabi";
                runGenerate({ language: regional, avoid: [...new Set([...avoidList,"avoid_mainstream"])] });
              }} />
              <QuickAction label="🚫 Avoid Mainstream" onClick={() => runGenerate({ avoid: [...new Set([...avoidList,"avoid_mainstream"])] })} />
              <QuickAction label="🎭 Change Mood" onClick={() => {
                const next = MOODS[(MOODS.indexOf(mood as typeof MOODS[number]) + 1) % MOODS.length];
                runGenerate({ mood: next });
              }} />
            </div>

            {/* Recommendation cards */}
            <div className="space-y-4">
              {recs.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DiscoveryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white/70">
        Loading Fresh Finds...
      </div>
    </div>
  );
}

function FormCard({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
      <p className="text-sm font-semibold text-white mb-3">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      {children}
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-xl text-sm font-medium hover:border-red-500/50 hover:text-white hover:bg-white/20 transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500">
      {label}
    </button>
  );
}

const FRESHNESS_BADGE: Record<string, string> = {
  Safe:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Balanced: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Fresh:    "bg-green-500/20 text-green-400 border-green-500/30",
};

function RecCard({ rec, index }: { rec: RecommendationCard; index: number }) {
  const gradients = [
    "from-red-500 to-pink-500",
    "from-pink-500 to-purple-500",
    "from-purple-500 to-blue-500",
    "from-blue-500 to-cyan-500",
    "from-cyan-500 to-green-500",
    "from-green-500 to-yellow-500",
    "from-yellow-500 to-orange-500",
    "from-orange-500 to-red-500",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Gradient artwork placeholder */}
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg`}>
          🎵
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">{rec.title}</h3>
              <p className="text-sm text-white/60 mt-0.5">{rec.artist_or_type}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${FRESHNESS_BADGE[rec.freshness_label] ?? "bg-white/10 text-white/60 border-white/20"}`}>
              {rec.freshness_label}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-sm mb-2">
            <div className="bg-white/5 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Why this fits</p>
              <p className="text-white/70 leading-relaxed text-xs">{rec.why_this_fits}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-1">Language &amp; mood fit</p>
              <p className="text-white/70 leading-relaxed text-xs">{rec.language_mood_fit}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
              <strong>Freshness:</strong> {rec.how_fresh_this_is}
            </span>
            {rec.avoids_repeating && (
              <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full">
                <strong>Avoids:</strong> {rec.avoids_repeating}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
