/**
 * Fallback Analysis Data
 *
 * Pre-generated analysis used when Groq API is unavailable.
 * Represents realistic themes derived from common public review patterns
 * about Indian music streaming discovery problems.
 *
 * DISCLAIMER: These quotes are representative of public review-style feedback
 * used for demo fallback. Not real individual user data.
 */

export const FALLBACK_ANALYSIS = {
  summary:
    "Users consistently report frustration with repetitive recommendation loops, mainstream popularity bias, and poor context-awareness in music discovery. There is a clear, unmet demand for fresh regional/indie tracks, activity-specific playlists, and user-controlled discovery parameters.",
  total_reviews_analyzed: 8,
  date_range: "2026-01-01 to 2026-07-02",
  is_fallback: true,
  themes: [
    {
      theme_name: "Repetitive Recommendations & Playlist Fatigue",
      count: 5,
      description:
        "Users report being served the same songs and artists repeatedly, leading to listening loop frustration and reduced engagement.",
      pain_point:
        "The recommendation feed feels stale. Users stop exploring new music because the same tracks keep appearing regardless of how much they skip or rate.",
      representative_quotes: [
        "The same songs keep coming in recommendations again and again.",
        "I have been listening to the same 20 songs for weeks — the app doesn't show me anything new.",
        "I keep hearing the same playlists. Would love fresh recommendations that actually feel different.",
        "Every time I open the app, same artists appear. It's like the algorithm is stuck.",
        "I skip most recommendations now because I already know what's coming next.",
      ],
      opportunity:
        "Build a discovery parameter system that lets users explicitly exclude already-heard tracks, set freshness preferences, and surface long-tail content.",
    },
    {
      theme_name: "Mainstream & Viral Dominance",
      count: 4,
      description:
        "The recommendation system over-indexes on popularity signals, surfacing trending/viral hits at the expense of niche, indie, or regional artists.",
      pain_point:
        "Users who want regional or underground music are pushed Bollywood chart-toppers regardless of their actual preference signals.",
      representative_quotes: [
        "I want new Punjabi songs but mostly get the popular ones only.",
        "Everything recommended is mainstream and viral. What if I want regional music that is niche?",
        "The algorithm forces hits upon us — it doesn't care what we actually want to hear.",
        "I try to find underrated indie or regional music but it constantly pushes mainstream Bollywood on my feed.",
      ],
      opportunity:
        "Introduce a 'Freshness' dial that actively reduces mainstream content in favour of emerging artists and regional genres when selected.",
    },
    {
      theme_name: "Mood & Context Mismatch",
      count: 3,
      description:
        "Users select mood or activity tags but receive recommendations that don't match their actual listening context.",
      pain_point:
        "Selecting 'Chill' plays upbeat bhangra; selecting 'Focus' plays songs with distracting lyrics — the algorithm doesn't map mood signals to appropriate tempo and energy.",
      representative_quotes: [
        "The app does not understand my mood. Gym, travel, and chill music all feel mixed.",
        "I select Chill Hindi but it starts playing upbeat bhangra. Recommendation engine doesn't understand context.",
        "I want Gym music that matches my pace, not random Bollywood from the charts.",
      ],
      opportunity:
        "Implement multi-parameter discovery that combines mood + activity + language + freshness as compound filters, not just single-signal recommendations.",
    },
    {
      theme_name: "Regional & Indie Discovery Gaps",
      count: 3,
      description:
        "Regional language listeners and indie music fans feel under-served. Discovery surfaces Hindi/mainstream content even for users who primarily consume Tamil, Telugu, Bhojpuri, or indie-label tracks.",
      pain_point:
        "Regional songs are there, but discovery is not easy. The app doesn't make regional content easy to find unless you already know what you're looking for.",
      representative_quotes: [
        "Regional songs are there, but discovery is not easy.",
        "I usually go back to my old playlist because finding fresh Tamil songs takes effort.",
        "I love Bhojpuri folk music but the app always recommends mainstream Hindi. I have to search manually every time.",
      ],
      opportunity:
        "Build language-first discovery flows where users can pin a regional language preference and receive active suggestions of emerging artists in that language.",
    },
    {
      theme_name: "Lack of User Control & Explainability",
      count: 2,
      description:
        "Users feel passive recipients of recommendations with no way to understand why a song was suggested or to meaningfully influence future suggestions.",
      pain_point:
        "There is no 'why this?' explanation, no 'less of this' button, no way to tell the app what you want to avoid.",
      representative_quotes: [
        "I usually go back to my old playlist because finding fresh songs takes effort.",
        "I can't tell the app I'm tired of a certain artist — I just have to manually skip forever.",
      ],
      opportunity:
        "Add explicit controls: avoid artists, set freshness, provide reference input — giving users agency over discovery rather than passive consumption.",
    },
  ],
  sentiment_summary: {
    positive: 12,
    neutral: 23,
    negative: 65,
  },
  target_user_segment:
    "Young Indian listeners aged 18–30 who are digitally native, open to diverse Indian regional and indie genres, but feel trapped in mainstream recommendation loops. They are willing to put in effort to find good music but frustrated when the platform doesn't support discovery.",
  problem_statement:
    "Young Indian music listeners on streaming platforms fall into repetitive listening loops because recommendation systems prioritise familiarity and viral popularity over fresh, contextually-relevant discovery. Users who want niche, regional, or mood-specific music have no effective controls to break out of the mainstream filter bubble.",
  business_opportunity:
    "Introducing AI-powered, user-controllable music discovery — with explicit parameters for mood, activity, language, freshness, and avoidance preferences — directly addresses the #1 frustration in public user feedback. This can increase session length, improve discovery metrics, and surface long-tail regional catalog content that currently receives low organic exposure.",
};
