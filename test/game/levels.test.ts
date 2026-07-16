import { describe, expect, it } from "vitest";
import { LEVEL_1, LEVEL_5, LEVELS } from "../../src/game/levels";

describe("LEVELS", () => {
  it("has five levels with unique ids", () => {
    expect(LEVELS).toHaveLength(5);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(5);
  });

  it("has finite, positive numeric fields on every level", () => {
    for (const level of LEVELS) {
      expect(Number.isFinite(level.shipStart.pos.x)).toBe(true);
      expect(Number.isFinite(level.shipStart.pos.y)).toBe(true);
      expect(Number.isFinite(level.targetOrbit.startAngle)).toBe(true);
      expect(level.targetOrbit.radius).toBeGreaterThan(0);
      expect(level.captureRadius).toBeGreaterThan(0);
      expect(level.speedThreshold).toBeGreaterThan(0);
      expect(level.fuelCapacity).toBeGreaterThan(0);
      expect(level.parBurns).toBeGreaterThan(0);
      expect(level.parTime).toBeGreaterThan(0);
    }
  });

  // Level 5 "Tight Budget": Level 1's exact geometry, but a much smaller fuel
  // budget so sloppy corrections are unaffordable (spec §9). It must still be
  // solvable — capacity has to clear the ideal two-burn Hohmann cost with room
  // for a clean run to keep its 3-star fuel rating.
  it("gives Level 5 the same geometry as Level 1 but a much tighter fuel budget", () => {
    expect(LEVEL_5.shipStart.pos).toEqual(LEVEL_1.shipStart.pos);
    expect(LEVEL_5.targetOrbit).toEqual(LEVEL_1.targetOrbit);
    expect(LEVEL_5.fuelCapacity).toBeLessThan(LEVEL_1.fuelCapacity / 2);
    // Ideal Level 1 Hohmann costs ~13.9 fuel; keep a clean run at 3 stars
    // (>=60% remaining) => capacity must be >= ~35.
    expect(LEVEL_5.fuelCapacity).toBeGreaterThanOrEqual(35);
  });
});
