export interface DiscoveryIntent {
  mood?: string;
  language?: string;
  activity?: string;
  freshness?: "Safe" | "Balanced" | "Fresh";
  reference?: string;
  avoid: string[];
}

const LANGUAGE_RULES: Array<[RegExp, string]> = [
  [/\b(hindi|bollywood)\b/i, "Hindi"],
  [/\b(punjabi|sidhu|diljit|karan aujla|ap dhillon)\b/i, "Punjabi"],
  [/\btamil\b/i, "Tamil"],
  [/\btelugu\b/i, "Telugu"],
  [/\bbhojpuri\b/i, "Bhojpuri"],
  [/\benglish\b/i, "English"],
];

const ACTIVITY_RULES: Array<[RegExp, string]> = [
  [/\b(gym|workout|running)\b/i, "Gym"],
  [/\b(travel|drive|road trip)\b/i, "Travel"],
  [/\b(late night|night|sleep)\b/i, "Late night"],
  [/\b(focus|study|work)\b/i, "Focus"],
  [/\b(party|dance|club)\b/i, "Party"],
  [/\b(chill|slow|calm|relaxing)\b/i, "Chill"],
  [/\b(sad|emotional|heartbreak)\b/i, "Sad"],
];

export function inferDiscoveryIntent(query = ""): DiscoveryIntent {
  const text = query.trim();
  const lower = text.toLowerCase();
  const intent: DiscoveryIntent = { avoid: [] };

  for (const [pattern, language] of LANGUAGE_RULES) {
    if (pattern.test(lower)) {
      intent.language = language;
      break;
    }
  }

  for (const [pattern, value] of ACTIVITY_RULES) {
    if (pattern.test(lower)) {
      if (["Gym", "Travel", "Late night", "Focus", "Party"].includes(value)) {
        intent.activity = value;
      } else {
        intent.mood = value;
      }
      break;
    }
  }

  if (/\b(old|classic|evergreen|nostalgic|popular)\b/i.test(lower)) {
    intent.freshness = "Safe";
  } else if (/\b(fresh|new|underrated|less viral|hidden gems)\b/i.test(lower)) {
    intent.freshness = "Fresh";
  } else if (/\b(similar|like|mix)\b/i.test(lower)) {
    intent.freshness = "Balanced";
  }

  if (/\b(less viral|not viral)\b/i.test(lower)) {
    intent.avoid.push("avoid_overplayed");
  }
  if (/\b(not same artist|different artist)\b/i.test(lower)) {
    intent.avoid.push("avoid_repeated_artists");
  }
  if (/\b(not mainstream|less mainstream)\b/i.test(lower)) {
    intent.avoid.push("avoid_mainstream");
  }

  const likeMatch = text.match(/\blike\s+([^,]+?)(?:\s+but|\s+and|$)/i);
  if (likeMatch?.[1]) {
    intent.reference = likeMatch[1].trim();
  } else if (text && text.split(/\s+/).length <= 4) {
    intent.reference = text;
  } else if (text) {
    intent.reference = text;
  }

  return {
    ...intent,
    avoid: Array.from(new Set(intent.avoid)),
  };
}
