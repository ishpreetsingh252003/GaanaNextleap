/**
 * Fallback Review Data
 * 
 * 120 public-review-style feedback entries distributed across 6 sources.
 * Used for reliable demo analysis when live scraping is unavailable.
 * 
 * DISCLAIMER: Representative public review-style feedback for demo purposes.
 * Not real individual user data. Dates: Jan 2026 - Jul 2026.
 */

export interface FallbackReview {
  id: string;
  source: 'google_play' | 'app_store' | 'reddit' | 'quora' | 'web_news' | 'twitter_web';
  text: string;
  date: string;
  rating?: number;
}

export const fallbackReviews: FallbackReview[] = [
  // Google Play (20 entries)
  { id: 'gp-1', source: 'google_play', text: "The same songs keep coming in my recommendations even when I skip them. Every time I open Daily Mix it plays the exact same 15-20 tracks.", date: '2026-01-05', rating: 2 },
  { id: 'gp-2', source: 'google_play', text: "My daily mixes feel too similar every week. The algorithm does not seem to update based on what I actually listen to.", date: '2026-01-12', rating: 2 },
  { id: 'gp-3', source: 'google_play', text: "I have been listening to the same 20 songs for weeks. The app does not show me anything new or fresh.", date: '2026-01-18', rating: 2 },
  { id: 'gp-4', source: 'google_play', text: "I want new Punjabi songs but mostly get the popular viral ones only. Where are the underrated tracks?", date: '2026-01-25', rating: 3 },
  { id: 'gp-5', source: 'google_play', text: "Every time I open the app, same artists appear. Like the algorithm is stuck in a loop.", date: '2026-02-01', rating: 2 },
  { id: 'gp-6', source: 'google_play', text: "I usually return to my old playlist because discovery feels random and unpredictable.", date: '2026-02-08', rating: 3 },
  { id: 'gp-7', source: 'google_play', text: "I skip most recommendations now because I already know what is coming next. No surprises.", date: '2026-02-15', rating: 2 },
  { id: 'gp-8', source: 'google_play', text: "I want Gym music that matches my pace, not random Bollywood chart toppers.", date: '2026-02-22', rating: 3 },
  { id: 'gp-9', source: 'google_play', text: "Travel playlists are okay, but they do not change much week to week.", date: '2026-03-01', rating: 3 },
  { id: 'gp-10', source: 'google_play', text: "Recommendations not adapting to mood at all. Chill and Party playlists feel similar.", date: '2026-03-08', rating: 2 },
  { id: 'gp-11', source: 'google_play', text: "I keep hearing the same playlists. Would love fresh recommendations that actually feel different.", date: '2026-03-15', rating: 2 },
  { id: 'gp-12', source: 'google_play', text: "The app does not understand my mood. Gym, travel, and chill music all feel mixed together.", date: '2026-03-22', rating: 2 },
  { id: 'gp-13', source: 'google_play', text: "I select Chill Hindi but it starts playing upbeat bhangra. Recommendation engine does not understand context.", date: '2026-04-01', rating: 2 },
  { id: 'gp-14', source: 'google_play', text: "Fresh songs are hard to find unless I already know the artist name.", date: '2026-04-10', rating: 3 },
  { id: 'gp-15', source: 'google_play', text: "Regional songs are there, but discovery is not easy. Have to search manually.", date: '2026-04-18', rating: 3 },
  { id: 'gp-16', source: 'google_play', text: "I usually go back to my old playlist because finding fresh Tamil songs takes effort.", date: '2026-05-01', rating: 3 },
  { id: 'gp-17', source: 'google_play', text: "Hindi romantic recommendations keep repeating the same Arijit Singh songs.", date: '2026-05-15', rating: 2 },
  { id: 'gp-18', source: 'google_play', text: "I want more regional songs, but the app pushes popular Bollywood tracks first.", date: '2026-06-01', rating: 2 },
  { id: 'gp-19', source: 'google_play', text: "Sometimes I want familiar songs, but not the exact same songs again and again.", date: '2026-06-15', rating: 3 },
  { id: 'gp-20', source: 'google_play', text: "Gaana has a lot of music, but finding something new that matches my mood takes too much time.", date: '2026-07-01', rating: 3 },

  // App Store (20 entries)
  { id: 'as-1', source: 'app_store', text: "Recommendations feel stale. It does not matter if I choose chill or dance mood, it just plays the same viral Punjabi songs.", date: '2026-01-08', rating: 1 },
  { id: 'as-2', source: 'app_store', text: "Everything recommended is mainstream and viral. What if I want regional music that is niche?", date: '2026-01-16', rating: 2 },
  { id: 'as-3', source: 'app_store', text: "The algorithm forces hits upon us. It does not care what we actually want to hear.", date: '2026-01-22', rating: 2 },
  { id: 'as-4', source: 'app_store', text: "I try to find underrated indie or regional music but it constantly pushes mainstream Bollywood on my feed.", date: '2026-01-30', rating: 2 },
  { id: 'as-5', source: 'app_store', text: "I love Bhojpuri folk music but the app always recommends mainstream Hindi. I have to search manually every time.", date: '2026-02-05', rating: 2 },
  { id: 'as-6', source: 'app_store', text: "Bias towards mainstream. Everything is viral tracks and chart toppers only.", date: '2026-02-12', rating: 2 },
  { id: 'as-7', source: 'app_store', text: "Fresh songs get buried under the viral hits. Hard to discover new artists.", date: '2026-02-18', rating: 3 },
  { id: 'as-8', source: 'app_store', text: "I cannot tell the app I am tired of a certain artist. I just have to manually skip forever.", date: '2026-02-25', rating: 2 },
  { id: 'as-9', source: 'app_store', text: "Regional discovery is poor. Tamil and Telugu tracks are hard to find even though they exist in the catalog.", date: '2026-03-05', rating: 2 },
  { id: 'as-10', source: 'app_store', text: "Mood detection is broken. Late night romantic playlists include fast tempo dance songs.", date: '2026-03-12', rating: 2 },
  { id: 'as-11', source: 'app_store', text: "The same viral tracks appear in every mood playlist. No variety at all.", date: '2026-03-20', rating: 2 },
  { id: 'as-12', source: 'app_store', text: "I want control over freshness. Sometimes I want safe hits, sometimes I want new releases.", date: '2026-04-05', rating: 3 },
  { id: 'as-13', source: 'app_store', text: "Discovery takes too much effort. Easier to just replay old playlists than find something new.", date: '2026-04-12', rating: 3 },
  { id: 'as-14', source: 'app_store', text: "Repetitive recommendations kill the joy of discovery. Same artists, same songs, same playlist structure.", date: '2026-04-20', rating: 2 },
  { id: 'as-15', source: 'app_store', text: "I wish there was an avoid mainstream button. I want indie and regional, not chart toppers.", date: '2026-05-05', rating: 3 },
  { id: 'as-16', source: 'app_store', text: "The app has millions of songs but my feed only shows the same 100 tracks.", date: '2026-05-18', rating: 2 },
  { id: 'as-17', source: 'app_store', text: "Language filter does not work well. I set Tamil but get Hindi hits mixed in.", date: '2026-06-02', rating: 2 },
  { id: 'as-18', source: 'app_store', text: "Mainstream dominance is frustrating. Regional artists deserve better visibility.", date: '2026-06-10', rating: 2 },
  { id: 'as-19', source: 'app_store', text: "I want fresh but relevant recommendations. Current system gives either stale hits or random experimental tracks.", date: '2026-06-20', rating: 3 },
  { id: 'as-20', source: 'app_store', text: "Discovery agent or AI recommendations would help. Current system is too rigid and predictable.", date: '2026-07-02', rating: 3 },

  // Reddit (20 entries)
  { id: 'rd-1', source: 'reddit', text: "Does anyone else feel like Gaana keeps playing the exact same tracklist every day?", date: '2026-01-10' },
  { id: 'rd-2', source: 'reddit', text: "I try to find underrated indie or regional music but Gaana constantly pushes mainstream Bollywood.", date: '2026-01-18' },
  { id: 'rd-3', source: 'reddit', text: "Gaana playlist fatigue is real. Same artists, same vibe, same energy every week.", date: '2026-01-25' },
  { id: 'rd-4', source: 'reddit', text: "I wish streaming apps had a freshness dial. Sometimes I want safe, sometimes I want surprises.", date: '2026-02-03' },
  { id: 'rd-5', source: 'reddit', text: "Mood-based discovery is broken. Gym playlist has slow romantic songs mixed in. Makes no sense.", date: '2026-02-10' },
  { id: 'rd-6', source: 'reddit', text: "Regional music discovery is harder than it should be. Why is Bollywood always the default?", date: '2026-02-17' },
  { id: 'rd-7', source: 'reddit', text: "I keep returning to old playlists because discovering fresh music on Gaana feels like work.", date: '2026-02-24' },
  { id: 'rd-8', source: 'reddit', text: "The algorithm needs to learn when users are tired of an artist. No avoid button exists.", date: '2026-03-03' },
  { id: 'rd-9', source: 'reddit', text: "Fresh music gets buried under viral hits. Discovery should surface underrated tracks more.", date: '2026-03-10' },
  { id: 'rd-10', source: 'reddit', text: "Why does every mood playlist feel the same? Chill and Romantic playlists overlap too much.", date: '2026-03-18' },
  { id: 'rd-11', source: 'reddit', text: "I want Punjabi gym songs but not the same viral tracks. Where are the fresh regional artists?", date: '2026-03-25' },
  { id: 'rd-12', source: 'reddit', text: "Repetitive recommendation loops make me want to cancel my subscription. No variety.", date: '2026-04-02' },
  { id: 'rd-13', source: 'reddit', text: "Activity context matters but streaming apps ignore it. Travel music should be different from gym music.", date: '2026-04-10' },
  { id: 'rd-14', source: 'reddit', text: "I want control over discovery parameters. Let me set language, mood, freshness, and avoid preferences.", date: '2026-04-18' },
  { id: 'rd-15', source: 'reddit', text: "Mainstream bias is killing discovery. Indie and regional artists never appear in my feed.", date: '2026-05-01' },
  { id: 'rd-16', source: 'reddit', text: "Why is there no way to tell the app I am tired of a certain artist or song?", date: '2026-05-10' },
  { id: 'rd-17', source: 'reddit', text: "Fresh but relevant is the sweet spot. Current discovery gives stale or random, never balanced.", date: '2026-05-20' },
  { id: 'rd-18', source: 'reddit', text: "Regional language discovery needs better support. Tamil and Telugu listeners face discovery gaps.", date: '2026-06-05' },
  { id: 'rd-19', source: 'reddit', text: "Gaana has potential but recommendation fatigue is real. Same loop every week.", date: '2026-06-15' },
  { id: 'rd-20', source: 'reddit', text: "Discovery takes effort when it should be effortless. I just replay old favorites instead.", date: '2026-07-01' },

  // Quora (20 entries)
  { id: 'qa-1', source: 'quora', text: "Why does Gaana recommend the same tracks repeatedly? Recommender systems rely on popularity bias.", date: '2026-01-12' },
  { id: 'qa-2', source: 'quora', text: "If a Bollywood track is trending it spams discovery lists regardless of actual preferences.", date: '2026-01-20' },
  { id: 'qa-3', source: 'quora', text: "This is why users get stuck in listening loops. No escape from mainstream recommendations.", date: '2026-01-28' },
  { id: 'qa-4', source: 'quora', text: "Music streaming recommendation engines struggle with cold-start problem for emerging artists.", date: '2026-02-05' },
  { id: 'qa-5', source: 'quora', text: "Regional music discovery is challenging because popularity algorithms favor Hindi and Punjabi hits.", date: '2026-02-13' },
  { id: 'qa-6', source: 'quora', text: "User-controlled discovery parameters would help. Let users set freshness, language, mood, and avoid options.", date: '2026-02-21' },
  { id: 'qa-7', source: 'quora', text: "The repetitive loop problem happens when recommendation engines optimize for engagement over variety.", date: '2026-03-01' },
  { id: 'qa-8', source: 'quora', text: "Mood and activity context are better discovery signals than genre alone.", date: '2026-03-10' },
  { id: 'qa-9', source: 'quora', text: "Fresh but familiar is the ideal balance. Random feels irrelevant, stale feels boring.", date: '2026-03-18' },
  { id: 'qa-10', source: 'quora', text: "Mainstream viral dominance reduces discovery diversity. Long-tail content gets ignored.", date: '2026-03-25' },
  { id: 'qa-11', source: 'quora', text: "Regional language listeners face discovery gaps because algorithms optimize for Hindi and English.", date: '2026-04-02' },
  { id: 'qa-12', source: 'quora', text: "Users want agency over recommendations. Passive consumption leads to playlist fatigue.", date: '2026-04-12' },
  { id: 'qa-13', source: 'quora', text: "Repetitive artists and tracks reduce session length. Users disengage when discovery feels predictable.", date: '2026-04-20' },
  { id: 'qa-14', source: 'quora', text: "Activity-based music discovery is underutilized. Gym, travel, focus require different energy levels.", date: '2026-05-01' },
  { id: 'qa-15', source: 'quora', text: "Freshness control would improve discovery experience. Users want balance between familiar and new.", date: '2026-05-10' },
  { id: 'qa-16', source: 'quora', text: "Why is there no avoid artist or avoid mainstream feature? Users need negative feedback options.", date: '2026-05-20' },
  { id: 'qa-17', source: 'quora', text: "Recommendation loops happen when systems optimize click-through rate over exploration.", date: '2026-06-01' },
  { id: 'qa-18', source: 'quora', text: "Regional and indie artists need better visibility in recommendation feeds.", date: '2026-06-10' },
  { id: 'qa-19', source: 'quora', text: "User-controlled parameters let listeners fine-tune discovery without manual search.", date: '2026-06-20' },
  { id: 'qa-20', source: 'quora', text: "Discovery fatigue is the main reason users return to familiar playlists instead of exploring.", date: '2026-07-02' },

  // Web / News (20 entries)
  { id: 'wn-1', source: 'web_news', text: "Users complain about repetitive loops on Gaana and other streaming platforms.", date: '2026-01-15' },
  { id: 'wn-2', source: 'web_news', text: "Recommender systems struggle with cold-start problem for emerging and regional artists.", date: '2026-01-22' },
  { id: 'wn-3', source: 'web_news', text: "Playlist fatigue is a growing issue as users hear the same tracks across multiple playlists.", date: '2026-02-01' },
  { id: 'wn-4', source: 'web_news', text: "Mainstream and viral content dominates discovery feeds reducing exposure for indie music.", date: '2026-02-10' },
  { id: 'wn-5', source: 'web_news', text: "Young listeners want fresh but relevant recommendations, not random experimental tracks.", date: '2026-02-18' },
  { id: 'wn-6', source: 'web_news', text: "Regional music discovery remains challenging despite large catalogs available on streaming platforms.", date: '2026-02-26' },
  { id: 'wn-7', source: 'web_news', text: "Mood-based recommendations often miss the mark due to poor context understanding.", date: '2026-03-05' },
  { id: 'wn-8', source: 'web_news', text: "Activity-specific playlists like gym, travel, focus need better curation and personalization.", date: '2026-03-15' },
  { id: 'wn-9', source: 'web_news', text: "Popularity bias in recommendation algorithms creates filter bubbles reducing discovery diversity.", date: '2026-03-22' },
  { id: 'wn-10', source: 'web_news', text: "User-controlled discovery parameters are emerging as the next evolution in music recommendation.", date: '2026-04-01' },
  { id: 'wn-11', source: 'web_news', text: "Repetitive recommendation loops drive users back to familiar playlists instead of exploration.", date: '2026-04-10' },
  { id: 'wn-12', source: 'web_news', text: "Fresh and familiar balance is key to effective music discovery experience.", date: '2026-04-18' },
  { id: 'wn-13', source: 'web_news', text: "Regional language listeners face discovery gaps as algorithms optimize for mainstream languages.", date: '2026-05-01' },
  { id: 'wn-14', source: 'web_news', text: "Streaming platforms need better negative feedback mechanisms like avoid artist or avoid mainstream.", date: '2026-05-12' },
  { id: 'wn-15', source: 'web_news', text: "Mood and context are stronger discovery signals than genre-based classification.", date: '2026-05-20' },
  { id: 'wn-16', source: 'web_news', text: "Discovery fatigue reduces session length and user engagement on streaming platforms.", date: '2026-06-01' },
  { id: 'wn-17', source: 'web_news', text: "AI-powered discovery agents could offer personalized control over freshness and variety.", date: '2026-06-10' },
  { id: 'wn-18', source: 'web_news', text: "Indie and regional artists struggle for visibility in mainstream-dominated recommendation feeds.", date: '2026-06-18' },
  { id: 'wn-19', source: 'web_news', text: "Young Indian listeners want discovery systems that respect language, mood, and freshness preferences.", date: '2026-06-25' },
  { id: 'wn-20', source: 'web_news', text: "The future of music discovery lies in user agency and AI-powered personalization.", date: '2026-07-03' },

  // Twitter / X (20 entries)
  { id: 'tw-1', source: 'twitter_web', text: "Tired of the same Gaana recommendations every day. Where is the variety?", date: '2026-01-14' },
  { id: 'tw-2', source: 'twitter_web', text: "Why does every streaming app push mainstream hits only? Regional music deserves better.", date: '2026-01-21' },
  { id: 'tw-3', source: 'twitter_web', text: "Playlist fatigue is real. Same tracks in every mood playlist on Gaana.", date: '2026-01-28' },
  { id: 'tw-4', source: 'twitter_web', text: "Give me a freshness dial already. Sometimes I want safe, sometimes I want new releases.", date: '2026-02-06' },
  { id: 'tw-5', source: 'twitter_web', text: "Discovery should be effortless not exhausting. Gaana needs better recommendation algorithms.", date: '2026-02-14' },
  { id: 'tw-6', source: 'twitter_web', text: "Mood detection is broken. Chill playlist has fast bhangra mixed in. Makes no sense.", date: '2026-02-22' },
  { id: 'tw-7', source: 'twitter_web', text: "I want Punjabi gym songs but not the same viral tracks everyone has heard already.", date: '2026-03-02' },
  { id: 'tw-8', source: 'twitter_web', text: "Why is there no avoid artist button? I am tired of hearing the same voice again and again.", date: '2026-03-11' },
  { id: 'tw-9', source: 'twitter_web', text: "Regional discovery is hard. Tamil and Telugu tracks exist but algorithm never shows them.", date: '2026-03-19' },
  { id: 'tw-10', source: 'twitter_web', text: "Fresh but relevant is what I need. Current discovery gives stale or random, never balanced.", date: '2026-03-27' },
  { id: 'tw-11', source: 'twitter_web', text: "Mainstream dominance kills discovery. Indie artists never show up in my feed.", date: '2026-04-05' },
  { id: 'tw-12', source: 'twitter_web', text: "Recommendation loops are frustrating. Same 20 songs in every playlist variation.", date: '2026-04-13' },
  { id: 'tw-13', source: 'twitter_web', text: "I just replay old playlists because finding fresh music takes too much effort on Gaana.", date: '2026-04-22' },
  { id: 'tw-14', source: 'twitter_web', text: "Activity context matters. Gym music should be different from late night chill music.", date: '2026-05-02' },
  { id: 'tw-15', source: 'twitter_web', text: "Let me control discovery. Language, mood, freshness, avoid options. Is that too much to ask?", date: '2026-05-12' },
  { id: 'tw-16', source: 'twitter_web', text: "Discovery fatigue is why I cancel subscriptions. Same content loop every month.", date: '2026-05-21' },
  { id: 'tw-17', source: 'twitter_web', text: "Regional language listeners are ignored by mainstream recommendation algorithms.", date: '2026-06-03' },
  { id: 'tw-18', source: 'twitter_web', text: "Viral tracks spam every playlist. Underrated gems get buried. Fix this Gaana.", date: '2026-06-12' },
  { id: 'tw-19', source: 'twitter_web', text: "Fresh music discovery should not feel like homework. Make it intuitive and effortless.", date: '2026-06-22' },
  { id: 'tw-20', source: 'twitter_web', text: "AI agent for music discovery would be amazing. Let me set preferences and get curated picks.", date: '2026-07-03' },
];
