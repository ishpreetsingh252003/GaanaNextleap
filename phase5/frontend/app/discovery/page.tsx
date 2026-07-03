"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import {
  generateRecommendations, DiscoveryPreferences, RecommendationCard, BackendError,
} from "../../lib/api";

const MOODS = ["Chill","Sad","Party","Gym","Travel","Focus","Romantic","Energetic"] as const;
const LANGUAGES = ["Hindi","Punjabi","Tamil","Telugu","Bhojpuri","English","Mixed"] as const;
const ACTIVITIES = ["Studying","Travelling","Gym","Late night","Party","Work","Relaxing"] as const;
const FRESHNESS = ["Safe","Balanced","Fresh"] as const;

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
  const [mood, setMood]         = useState("");
  const [language, setLanguage] = useState("");
  const [activity, setActivity] = useState("");
  const [freshness, setFreshness] = useState("");
  const [reference, setReference] = useState("");
  const [avoidList, setAvoidList] = useState<string[]>([]);
  const [status, setStatus]     = useState<Status>("idle");
  const [loadStep, setLoadStep] = useState(0);
  const [recs, setRecs]         = useState<RecommendationCard[]>([]);
  const [explanation, setExplanation] = useState("");
  const [queryUsed, setQueryUsed] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    if (lower.includes("fresh") || lower.includes("new") || lower.includes("not the same viral")) setFreshness("Fresh");
    else setFreshness("Balanced");
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
    const prefs: DiscoveryPreferences = {
      mood: overrides?.mood ?? mood,
      language: overrides?.language ?? language,
      activity: overrides?.activity ?? activity,
      freshness: overrides?.freshness ?? freshness,
      reference: overrides?.reference !== undefined ? overrides.reference : reference || undefined,
      avoid: overrides?.avoid ?? avoidList,
    };

    if (!prefs.mood || !prefs.language || !prefs.activity || !prefs.freshness) {
      setErrorMsg("Please fill in all required fields: Mood, Language, Activity, and Freshness.");
      return;
    }

    // Sync state so UI reflects what was sent
    if (overrides?.mood)      setMood(overrides.mood);
    if (overrides?.freshness) setFreshness(overrides.freshness);
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
      setStatus("success");
    } catch (err) {
      clearInterval(ticker);
      const msg = err instanceof BackendError ? err.message : err instanceof Error ? err.message : "Failed to generate recommendations";
      setErrorMsg(msg); setStatus("error");
    }
  }, [mood, language, activity, freshness, reference, avoidList]);

  const isFormReady = mood && language && activity && freshness;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <Link href="/" className="font-bold text-lg">🎵 Gaana Discovery AI</Link>
        <nav className="flex gap-4 sm:gap-5 text-sm text-white/80">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/reviews" className="hover:text-white">Review Engine</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/discovery" className="text-white font-semibold border-b border-white">Discovery Agent</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Music Discovery Agent</h1>
          <p className="text-gray-500 text-sm">
            Tell us your mood, language, and activity — get 8–10 fresh but relevant Indian music picks with specific reasoning for each.
          </p>
        </div>

        {/* Demo examples */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Try a demo query</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => prefillDemo(ex)}
                className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <FormCard label="Mood" required>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button key={m} onClick={() => setMood(m)} type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${mood === m ? "bg-purple-700 text-white border-purple-700" : "bg-white border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  {m}
                </button>
              ))}
            </div>
          </FormCard>

          <FormCard label="Language" required>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button key={l} onClick={() => setLanguage(l)} type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${language === l ? "bg-purple-700 text-white border-purple-700" : "bg-white border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </FormCard>

          <FormCard label="Activity" required>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button key={a} onClick={() => setActivity(a)} type="button"
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${activity === a ? "bg-purple-700 text-white border-purple-700" : "bg-white border-gray-200 text-gray-600 hover:border-purple-300"}`}>
                  {a}
                </button>
              ))}
            </div>
          </FormCard>

          <FormCard label="Freshness" required>
            <div className="space-y-2">
              {FRESHNESS.map((f) => (
                <label key={f} className={`flex items-start gap-3 cursor-pointer p-2.5 rounded-xl border transition-all ${freshness === f ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-200"}`}>
                  <input type="radio" name="freshness" value={f} checked={freshness === f} onChange={() => setFreshness(f)} className="mt-0.5 accent-purple-600" />
                  <div>
                    <span className="font-medium text-sm text-gray-800">{f}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{FRESHNESS_DESC[f]}</p>
                  </div>
                </label>
              ))}
            </div>
          </FormCard>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          <FormCard label="Reference artist or song (optional)">
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Sidhu Moose Wala, Arijit Singh, 'Kesariya'"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <p className="text-xs text-gray-400 mt-1.5">We'll find similar vibe — not the exact same songs.</p>
          </FormCard>

          <FormCard label="Avoid preferences">
            <div className="space-y-2">
              {AVOID_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                  <input type="checkbox" checked={avoidList.includes(opt.value)} onChange={() => toggleAvoid(opt.value)}
                    className="w-4 h-4 rounded border-gray-300 accent-purple-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </FormCard>
        </div>

        <button onClick={() => runGenerate()} disabled={status === "loading" || !isFormReady}
          className="w-full bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 mb-3">
          {status === "loading"
            ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⏳</span>{LOAD_STEPS[loadStep]}</span>
            : "🎵 Discover Music"}
        </button>

        {!isFormReady && (
          <p className="text-xs text-center text-gray-400 mb-4">Select Mood, Language, Activity, and Freshness to generate recommendations.</p>
        )}

        <p className="text-xs text-gray-400 text-center mb-6">
          This MVP uses publicly available music metadata and AI inference for demonstration.
          It does not represent Gaana&apos;s full internal catalog.
        </p>

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm" role="alert">
            <p className="font-semibold text-red-700 mb-1">⚠️ Generation issue</p>
            <p className="text-red-600">{errorMsg}</p>
            <p className="text-gray-500 text-xs mt-2">
              AI generation failed temporarily. If GROQ_API_KEY is configured, check the backend logs. Otherwise a sample catalog fallback will be used automatically on retry.
            </p>
          </div>
        )}

        {status === "success" && recs.length > 0 && (
          <div className="mt-2">
            {isFallback && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-5 rounded-r-xl text-xs text-amber-800">
                <strong>💡 Demo fallback recommendations shown.</strong>{" "}
                AI generation was temporarily unavailable. These results are from the sample public music metadata catalog and represent realistic discovery picks for your preferences.
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white mb-5 shadow">
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

function FormCard({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {children}
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
      {label}
    </button>
  );
}

const FRESHNESS_BADGE: Record<string, string> = {
  Safe:     "bg-blue-100 text-blue-700 border-blue-200",
  Balanced: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Fresh:    "bg-green-100 text-green-700 border-green-200",
};

function RecCard({ rec, index }: { rec: RecommendationCard; index: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{rec.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{rec.artist_or_type}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${FRESHNESS_BADGE[rec.freshness_label] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
          {rec.freshness_label}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Why this fits</p>
          <p className="text-gray-700 leading-relaxed">{rec.why_this_fits}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Language &amp; mood fit</p>
          <p className="text-gray-700 leading-relaxed">{rec.language_mood_fit}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">
          <strong>Freshness:</strong> {rec.how_fresh_this_is}
        </span>
        {rec.avoids_repeating && (
          <span className="bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full">
            <strong>Avoids:</strong> {rec.avoids_repeating}
          </span>
        )}
      </div>
    </div>
  );
}
