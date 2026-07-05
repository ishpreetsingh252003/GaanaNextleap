import { describe, expect, it } from "vitest";
import { inferDiscoveryIntent } from "../src/services/discoveryIntent";

describe("inferDiscoveryIntent", () => {
  it("infers Punjabi gym fresh intent and avoid preferences", () => {
    const intent = inferDiscoveryIntent("Punjabi gym songs like Sidhu Moose Wala but fresher and less viral");

    expect(intent.language).toBe("Punjabi");
    expect(intent.activity).toBe("Gym");
    expect(intent.freshness).toBe("Fresh");
    expect(intent.reference).toBe("Sidhu Moose Wala");
    expect(intent.avoid).toContain("avoid_overplayed");
  });

  it("infers familiar chill intent from old popular slow songs", () => {
    const intent = inferDiscoveryIntent("old popular slow songs");

    expect(intent.mood).toBe("Chill");
    expect(intent.freshness).toBe("Safe");
    expect(intent.reference).toBe("old popular slow songs");
  });

  it("treats artist-only query as a reference", () => {
    const intent = inferDiscoveryIntent("Arijit Singh");

    expect(intent.reference).toBe("Arijit Singh");
    expect(intent.queryType).toBe("reference");
    expect(intent.mood).toBeUndefined();
    expect(intent.activity).toBeUndefined();
  });

  it("treats Sidhu as a Punjabi reference without mood or activity", () => {
    const intent = inferDiscoveryIntent("Sidhu");

    expect(intent.reference).toBe("Sidhu");
    expect(intent.queryType).toBe("reference");
    expect(intent.language).toBe("Punjabi");
    expect(intent.mood).toBeUndefined();
    expect(intent.activity).toBeUndefined();
  });

  it("only infers activity for Sidhu when explicit activity keywords exist", () => {
    const intent = inferDiscoveryIntent("Sidhu gym songs");

    expect(intent.reference).toBe("Sidhu gym songs");
    expect(intent.activity).toBe("Gym");
  });
});
