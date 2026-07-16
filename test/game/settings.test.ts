import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "../../src/game/settings.svelte";

describe("parseSettings", () => {
  it("returns defaults for a missing value", () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
  });

  it("returns defaults for unparseable JSON", () => {
    expect(parseSettings("{not json")).toEqual(defaultSettings());
  });

  it("returns defaults on a version mismatch", () => {
    expect(parseSettings(JSON.stringify({ version: 2, muted: true }))).toEqual(defaultSettings());
  });

  it("returns defaults when a field has the wrong type", () => {
    expect(parseSettings(JSON.stringify({ version: 1, muted: "yes" }))).toEqual(defaultSettings());
  });

  it("round-trips a valid persisted value", () => {
    expect(parseSettings(JSON.stringify({ version: 1, muted: true, reducedMotion: true }))).toEqual({
      version: 1,
      muted: true,
      reducedMotion: true,
    });
  });

  it("defaults reduced-motion off for a v1 save written before the field existed (Chunk 4)", () => {
    expect(parseSettings(JSON.stringify({ version: 1, muted: true }))).toEqual({
      version: 1,
      muted: true,
      reducedMotion: false,
    });
  });

  it("tolerates a wrong-typed reducedMotion by defaulting it off, keeping the valid muted", () => {
    expect(parseSettings(JSON.stringify({ version: 1, muted: true, reducedMotion: "yes" }))).toEqual({
      version: 1,
      muted: true,
      reducedMotion: false,
    });
  });

  it("defaults to unmuted, motion-on", () => {
    expect(defaultSettings().muted).toBe(false);
    expect(defaultSettings().reducedMotion).toBe(false);
  });
});
