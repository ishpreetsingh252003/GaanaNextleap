import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeITunesTrack, searchMusicCatalog } from "../src/services/musicCatalogService";

describe("musicCatalogService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns [] when the iTunes API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(searchMusicCatalog("Sidhu")).resolves.toEqual([]);
  });

  it("normalizes iTunes track metadata into catalog cards", () => {
    const track = normalizeITunesTrack({
      trackId: 123,
      trackName: "295",
      artistName: "Sidhu Moose Wala",
      collectionName: "Moosetape",
      artworkUrl100: "https://example.com/100x100bb.jpg",
      previewUrl: "https://example.com/preview.m4a",
      trackViewUrl: "https://itunes.apple.com/track",
    });

    expect(track).toEqual({
      id: "123",
      title: "295",
      artist: "Sidhu Moose Wala",
      album: "Moosetape",
      artwork: "https://example.com/300x300bb.jpg",
      previewUrl: "https://example.com/preview.m4a",
      externalUrl: "https://itunes.apple.com/track",
      source: "itunes",
      type: "track",
    });
  });

  it("searches the no-auth iTunes music endpoint and clamps limit to 12", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            trackId: 456,
            trackName: "Excuses",
            artistName: "AP Dhillon",
            collectionName: "Two Hearts Never Break The Same",
            artworkUrl100: "https://example.com/100x100bb.png",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const tracks = await searchMusicCatalog("AP Dhillon", { language: "Punjabi", limit: 99 });

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      title: "Excuses",
      artist: "AP Dhillon",
      source: "itunes",
    });
    const requestedUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestedUrl).toContain("https://itunes.apple.com/search");
    expect(requestedUrl).toContain("country=IN");
    expect(requestedUrl).toContain("media=music");
    expect(requestedUrl).toContain("entity=song");
    expect(requestedUrl).toContain("limit=12");
  });
});
