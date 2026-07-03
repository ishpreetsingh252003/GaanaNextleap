/**
 * Sample Music Catalog
 *
 * A lightweight in-memory catalog used as grounding data for the Discovery Agent
 * when Groq API is unavailable or for demo fallback purposes.
 *
 * IMPORTANT: This catalog uses publicly known music metadata for demonstration only.
 * It does NOT represent Gaana's full internal catalog.
 */

export interface CatalogTrack {
  title: string;
  artist: string;
  language: "Hindi" | "Punjabi" | "Tamil" | "Telugu" | "Bhojpuri" | "English" | "Mixed";
  moods: string[];
  activities: string[];
  popularity_level: "mainstream" | "balanced" | "underrated";
  freshness_level: "safe" | "balanced" | "fresh";
  tags: string[];
  region: string;
}

export const SAMPLE_CATALOG: CatalogTrack[] = [
  // ── Punjabi – Gym / Energetic ─────────────────────────────────────────────
  {
    title: "295",
    artist: "Sidhu Moose Wala",
    language: "Punjabi",
    moods: ["Energetic", "Party"],
    activities: ["Gym", "Party", "Travelling"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["punjabi", "urban", "hard-hitting"],
    region: "Punjab",
  },
  {
    title: "Goat",
    artist: "Karan Aujla",
    language: "Punjabi",
    moods: ["Energetic", "Party", "Gym"],
    activities: ["Gym", "Party"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["punjabi", "rap", "gym"],
    region: "Punjab",
  },
  {
    title: "Sher Khul Gaye",
    artist: "Badshah, Vishal Dadlani",
    language: "Hindi",
    moods: ["Energetic", "Gym"],
    activities: ["Gym", "Party"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["hindi", "motivational", "workout"],
    region: "Bollywood",
  },
  {
    title: "Patt Lainge",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    moods: ["Party", "Energetic"],
    activities: ["Party", "Gym"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["punjabi", "bhangra", "upbeat"],
    region: "Punjab",
  },
  {
    title: "Excuses",
    artist: "AP Dhillon, Gurinder Gill",
    language: "Punjabi",
    moods: ["Chill", "Romantic"],
    activities: ["Relaxing", "Late night"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["punjabi", "lo-fi", "modern"],
    region: "Punjab",
  },
  {
    title: "Brown Munde",
    artist: "AP Dhillon, Gurinder Gill, Shinda Kahlon",
    language: "Punjabi",
    moods: ["Party", "Energetic"],
    activities: ["Party", "Gym"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["punjabi", "viral", "party"],
    region: "Punjab",
  },
  {
    title: "Chamkila",
    artist: "Amar Singh Chamkila (classic)",
    language: "Punjabi",
    moods: ["Party", "Energetic"],
    activities: ["Party"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["punjabi", "folk", "classic", "regional"],
    region: "Punjab",
  },
  {
    title: "Morni",
    artist: "Satinder Sartaaj",
    language: "Punjabi",
    moods: ["Chill", "Romantic", "Focus"],
    activities: ["Relaxing", "Studying"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["punjabi", "sufi", "soulful", "underrated"],
    region: "Punjab",
  },
  {
    title: "Yaarian",
    artist: "Ninja",
    language: "Punjabi",
    moods: ["Chill", "Romantic"],
    activities: ["Relaxing", "Travelling"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["punjabi", "friendship", "melodic"],
    region: "Punjab",
  },
  {
    title: "Vaar",
    artist: "Gurdas Maan",
    language: "Punjabi",
    moods: ["Energetic", "Focus"],
    activities: ["Gym", "Studying"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["punjabi", "folk", "legend", "regional"],
    region: "Punjab",
  },

  // ── Hindi – Various Moods ─────────────────────────────────────────────────
  {
    title: "Kesariya",
    artist: "Arijit Singh",
    language: "Hindi",
    moods: ["Romantic", "Chill"],
    activities: ["Relaxing", "Late night", "Travelling"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["hindi", "romantic", "bollywood", "viral"],
    region: "Bollywood",
  },
  {
    title: "Raataan Lambiyan",
    artist: "Jubin Nautiyal, Asees Kaur",
    language: "Hindi",
    moods: ["Romantic", "Sad"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["hindi", "romantic", "overplayed"],
    region: "Bollywood",
  },
  {
    title: "Tu Hai Kahan",
    artist: "Prateek Kuhad",
    language: "Hindi",
    moods: ["Sad", "Chill", "Romantic"],
    activities: ["Late night", "Relaxing", "Studying"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "indie", "alternative", "soulful"],
    region: "Indie India",
  },
  {
    title: "Dil Bechara Title Track",
    artist: "A.R. Rahman",
    language: "Hindi",
    moods: ["Sad", "Romantic"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["hindi", "emotional", "a.r.rahman"],
    region: "Bollywood",
  },
  {
    title: "Ik Vaari Aa",
    artist: "Arijit Singh",
    language: "Hindi",
    moods: ["Sad", "Romantic", "Chill"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["hindi", "melancholic", "soulful"],
    region: "Bollywood",
  },
  {
    title: "Zaroorat",
    artist: "Ek Villain / Mustafa Zahid",
    language: "Hindi",
    moods: ["Sad", "Romantic"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "underrated", "indie-adjacent"],
    region: "Bollywood",
  },
  {
    title: "Bhoola Bhatka",
    artist: "Anuv Jain",
    language: "Hindi",
    moods: ["Chill", "Sad", "Romantic"],
    activities: ["Studying", "Relaxing", "Late night"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "indie", "emerging", "lo-fi"],
    region: "Indie India",
  },
  {
    title: "Chamki",
    artist: "Ritviz",
    language: "Hindi",
    moods: ["Party", "Energetic", "Travel"],
    activities: ["Party", "Travelling"],
    popularity_level: "balanced",
    freshness_level: "fresh",
    tags: ["hindi", "electronic", "indie", "danceable"],
    region: "Indie India",
  },
  {
    title: "Tere Bin",
    artist: "Vishal Mishra",
    language: "Hindi",
    moods: ["Sad", "Romantic"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["hindi", "emotional", "romantic"],
    region: "Bollywood",
  },
  {
    title: "Iktara",
    artist: "Kavita Seth",
    language: "Hindi",
    moods: ["Chill", "Focus", "Sad"],
    activities: ["Studying", "Relaxing", "Travelling"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "folk", "soulful", "timeless"],
    region: "Indie India",
  },
  {
    title: "Ranjha",
    artist: "B Praak, Jasleen Royal",
    language: "Hindi",
    moods: ["Romantic", "Sad"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["hindi", "romantic", "melodic"],
    region: "Bollywood",
  },
  {
    title: "Naina",
    artist: "Darshan Raval",
    language: "Hindi",
    moods: ["Romantic", "Sad"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["hindi", "romantic", "melodic"],
    region: "Bollywood",
  },
  {
    title: "Alag Aasman",
    artist: "Anuv Jain",
    language: "Hindi",
    moods: ["Focus", "Chill", "Sad"],
    activities: ["Studying", "Relaxing"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "indie", "emerging", "focus"],
    region: "Indie India",
  },
  {
    title: "Coke Studio Bhajan",
    artist: "Nooran Sisters",
    language: "Hindi",
    moods: ["Chill", "Focus"],
    activities: ["Relaxing", "Studying"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["hindi", "folk", "devotional", "regional"],
    region: "North India",
  },

  // ── Tamil ─────────────────────────────────────────────────────────────────
  {
    title: "Jolly O Gymkhana",
    artist: "A.R. Rahman",
    language: "Tamil",
    moods: ["Party", "Energetic"],
    activities: ["Party", "Gym"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["tamil", "a.r.rahman", "party"],
    region: "Tamil Nadu",
  },
  {
    title: "Rowdy Baby",
    artist: "Dhanush, Dhee",
    language: "Tamil",
    moods: ["Party", "Energetic"],
    activities: ["Party", "Gym"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["tamil", "viral", "party", "dance"],
    region: "Tamil Nadu",
  },
  {
    title: "Kannaana Kanney",
    artist: "D. Imman",
    language: "Tamil",
    moods: ["Chill", "Sad", "Romantic"],
    activities: ["Relaxing", "Late night"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["tamil", "emotional", "soulful", "underrated"],
    region: "Tamil Nadu",
  },
  {
    title: "Uyire",
    artist: "A.R. Rahman",
    language: "Tamil",
    moods: ["Romantic", "Chill"],
    activities: ["Relaxing", "Late night", "Travelling"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["tamil", "classic", "romantic"],
    region: "Tamil Nadu",
  },
  {
    title: "Kaadhal Rojave",
    artist: "A.R. Rahman",
    language: "Tamil",
    moods: ["Romantic", "Sad"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["tamil", "classic", "soulful", "romantic"],
    region: "Tamil Nadu",
  },
  {
    title: "Nenjame",
    artist: "Sid Sriram",
    language: "Tamil",
    moods: ["Sad", "Chill", "Romantic"],
    activities: ["Late night", "Relaxing", "Travelling"],
    popularity_level: "balanced",
    freshness_level: "fresh",
    tags: ["tamil", "indie", "soulful", "emerging"],
    region: "Tamil Nadu",
  },

  // ── Telugu ────────────────────────────────────────────────────────────────
  {
    title: "Naatu Naatu",
    artist: "M.M. Keeravani, Rahul Sipligunj",
    language: "Telugu",
    moods: ["Party", "Energetic"],
    activities: ["Party", "Gym"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["telugu", "international", "viral", "dance"],
    region: "Andhra/Telangana",
  },
  {
    title: "Oo Antava",
    artist: "Indravathi Chauhan",
    language: "Telugu",
    moods: ["Party", "Energetic"],
    activities: ["Party"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["telugu", "item", "viral", "dance"],
    region: "Andhra/Telangana",
  },
  {
    title: "Saami Saami",
    artist: "Mounika Yadav",
    language: "Telugu",
    moods: ["Party", "Chill"],
    activities: ["Party", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["telugu", "melodic", "dance"],
    region: "Andhra/Telangana",
  },
  {
    title: "Manasuna Manasai",
    artist: "Devi Sri Prasad",
    language: "Telugu",
    moods: ["Romantic", "Chill"],
    activities: ["Late night", "Relaxing"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["telugu", "romantic", "underrated", "regional"],
    region: "Andhra/Telangana",
  },

  // ── Bhojpuri ─────────────────────────────────────────────────────────────
  {
    title: "Lollipop Lagelu",
    artist: "Pawan Singh",
    language: "Bhojpuri",
    moods: ["Party", "Energetic"],
    activities: ["Party"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["bhojpuri", "viral", "party"],
    region: "Bihar/UP",
  },
  {
    title: "Aate Jaate",
    artist: "Dinesh Lal Yadav",
    language: "Bhojpuri",
    moods: ["Romantic", "Chill"],
    activities: ["Relaxing", "Travelling"],
    popularity_level: "balanced",
    freshness_level: "balanced",
    tags: ["bhojpuri", "folk", "romantic", "regional"],
    region: "Bihar/UP",
  },
  {
    title: "Tohre Karan Bhail",
    artist: "Khesari Lal Yadav",
    language: "Bhojpuri",
    moods: ["Sad", "Romantic"],
    activities: ["Relaxing", "Late night"],
    popularity_level: "underrated",
    freshness_level: "fresh",
    tags: ["bhojpuri", "sad", "regional", "underrated"],
    region: "Bihar/UP",
  },

  // ── English / Global ──────────────────────────────────────────────────────
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    language: "English",
    moods: ["Energetic", "Party", "Gym"],
    activities: ["Gym", "Party", "Travelling"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["english", "pop", "workout", "mainstream"],
    region: "International",
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    language: "English",
    moods: ["Party", "Energetic", "Chill"],
    activities: ["Party", "Gym"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["english", "pop", "dance"],
    region: "International",
  },
  {
    title: "Heat Waves",
    artist: "Glass Animals",
    language: "English",
    moods: ["Chill", "Sad", "Focus"],
    activities: ["Studying", "Late night", "Relaxing"],
    popularity_level: "balanced",
    freshness_level: "fresh",
    tags: ["english", "alternative", "indie", "atmospheric"],
    region: "International",
  },
  {
    title: "As It Was",
    artist: "Harry Styles",
    language: "English",
    moods: ["Chill", "Sad"],
    activities: ["Relaxing", "Travelling"],
    popularity_level: "mainstream",
    freshness_level: "safe",
    tags: ["english", "pop", "mellow"],
    region: "International",
  },
];

/**
 * Filter catalog by user preferences.
 * Returns matching tracks sorted by relevance.
 */
export function filterCatalog(preferences: {
  language: string;
  mood: string;
  activity: string;
  freshness: string;
  avoid: string[];
}): CatalogTrack[] {
  const { language, mood, activity, freshness, avoid } = preferences;

  const freshnessMap: Record<string, CatalogTrack["freshness_level"][]> = {
    Safe: ["safe"],
    Balanced: ["safe", "balanced"],
    Fresh: ["balanced", "fresh"],
  };

  const allowedFreshness = freshnessMap[freshness] || ["safe", "balanced", "fresh"];
  const avoidMainstream = avoid.includes("avoid_mainstream");
  const avoidSlow = avoid.includes("avoid_slow");
  const avoidSad = avoid.includes("avoid_sad");

  return SAMPLE_CATALOG.filter((track) => {
    // Language filter (Mixed accepts all)
    if (language !== "Mixed" && track.language !== language) return false;

    // Freshness filter
    if (!allowedFreshness.includes(track.freshness_level)) return false;

    // Avoid mainstream
    if (avoidMainstream && track.popularity_level === "mainstream") return false;

    // Mood and activity soft match
    const moodMatch = track.moods.some((m) => m.toLowerCase() === mood.toLowerCase());
    const activityMatch = track.activities.some((a) => a.toLowerCase() === activity.toLowerCase());

    // Must match at least mood OR activity for relevance
    if (!moodMatch && !activityMatch) return false;

    // Avoid sad
    if (avoidSad && track.moods.includes("Sad")) return false;

    return true;
  });
}
