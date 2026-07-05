export interface MusicCatalogTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  previewUrl?: string;
  externalUrl?: string;
  source: "itunes";
  type: "track";
}

interface ITunesSearchResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
}

interface ITunesSearchResponse {
  resultCount?: number;
  results?: ITunesSearchResult[];
}

export async function searchMusicCatalog(
  query: string,
  options?: {
    language?: string;
    mood?: string;
    freshness?: string;
    limit?: number;
  }
): Promise<MusicCatalogTrack[]> {
  const searchTerm = buildSearchTerm(query, options);
  if (!searchTerm) return [];

  const limit = Math.max(8, Math.min(options?.limit ?? 12, 12));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=IN&media=music&entity=song&limit=${limit}`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];

    const data = (await response.json()) as ITunesSearchResponse;
    return (data.results ?? [])
      .map(normalizeITunesTrack)
      .filter((track): track is MusicCatalogTrack => Boolean(track))
      .slice(0, limit);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeITunesTrack(result: ITunesSearchResult): MusicCatalogTrack | null {
  if (!result.trackId || !result.trackName || !result.artistName) return null;

  return {
    id: String(result.trackId),
    title: result.trackName,
    artist: result.artistName,
    album: result.collectionName,
    artwork: upgradeArtwork(result.artworkUrl100),
    previewUrl: result.previewUrl,
    externalUrl: result.trackViewUrl,
    source: "itunes",
    type: "track",
  };
}

function buildSearchTerm(
  query: string,
  options?: {
    language?: string;
    mood?: string;
    freshness?: string;
    limit?: number;
  }
): string {
  const parts = [query.trim()];
  if (options?.language && options.language !== "Mixed") parts.push(options.language);
  return Array.from(new Set(parts.filter(Boolean))).join(" ");
}

function upgradeArtwork(artwork?: string): string | undefined {
  return artwork?.replace("100x100bb", "300x300bb");
}
