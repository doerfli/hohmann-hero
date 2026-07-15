import { describe, expect, it } from "vitest";
import { LEVELS } from "../../src/game/levels";

describe("LEVELS", () => {
  it("has four levels with unique ids", () => {
    expect(LEVELS).toHaveLength(4);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(4);
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
});
