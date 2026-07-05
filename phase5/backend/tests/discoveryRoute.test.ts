import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchMusicCatalogMock = vi.hoisted(() => vi.fn());
const explainCatalogMatchesMock = vi.hoisted(() => vi.fn());

vi.mock("../src/services/musicCatalogService", () => ({
  searchMusicCatalog: searchMusicCatalogMock,
}));

vi.mock("../src/services/groqService", () => ({
  default: () => ({
    explainCatalogMatches: explainCatalogMatchesMock,
  }),
  GroqService: class {},
}));

import discoveryRoutes from "../src/routes/discovery";

describe("discovery route catalog behavior", () => {
  beforeEach(() => {
    searchMusicCatalogMock.mockReset();
    explainCatalogMatchesMock.mockReset();
    explainCatalogMatchesMock.mockResolvedValue({
      explanation: "Ranked using public catalog metadata.",
      matches: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fallback recommendations when catalog search fails", async () => {
    searchMusicCatalogMock.mockRejectedValue(new Error("itunes unavailable"));

    const response = await postDiscovery({ query: "late night Hindi songs" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.is_fallback).toBe(true);
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  });

  it("returns iTunes-sourced recommendations when catalog results exist", async () => {
    searchMusicCatalogMock.mockResolvedValue([
      {
        id: "1",
        title: "295",
        artist: "Sidhu Moose Wala",
        album: "Moosetape",
        artwork: "https://example.com/300x300bb.jpg",
        previewUrl: "https://example.com/preview.m4a",
        externalUrl: "https://itunes.apple.com/track",
        source: "itunes",
        type: "track",
      },
    ]);
    explainCatalogMatchesMock.mockRejectedValue(new Error("groq rate limited"));

    const response = await postDiscovery({ query: "Sidhu" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.matched_using).toBe("public_music_metadata");
    expect(response.body.recommendations[0]).toMatchObject({
      title: "295",
      artist: "Sidhu Moose Wala",
      source: "itunes",
      previewUrl: "https://example.com/preview.m4a",
    });
  });

  it("keeps Sidhu as a reference without random mood or activity in UI preferences", async () => {
    searchMusicCatalogMock.mockResolvedValue([]);

    const response = await postDiscovery({ query: "Sidhu" });

    expect(response.status).toBe(200);
    expect(response.body.ui_preferences).toMatchObject({
      query: "Sidhu",
      language: "Punjabi",
      mood: "",
      activity: "",
      freshness: "Balanced",
      reference: "Sidhu",
      queryType: "reference",
    });
    expect(searchMusicCatalogMock).toHaveBeenCalledWith(
      "Sidhu",
      expect.objectContaining({ language: "Punjabi", limit: 12 })
    );
  });
});

async function postDiscovery(body: Record<string, unknown>) {
  const app = express();
  app.use(express.json());
  app.use("/api", discoveryRoutes);

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/discovery-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await closeServer(server);
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
