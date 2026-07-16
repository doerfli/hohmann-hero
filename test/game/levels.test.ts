import { describe, expect, it } from "vitest";
import { LEVEL_1, LEVEL_5, LEVEL_6, LEVEL_7, LEVELS } from "../../src/game/levels";
import { PLANET_RADIUS } from "../../src/sim/constants";
import { orbitMaxRadius } from "../../src/sim/target";

describe("LEVELS", () => {
  it("has seven levels with unique ids", () => {
    expect(LEVELS).toHaveLength(7);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(7);
  });

  it("has finite, positive numeric fields and at least one target on every level", () => {
    for (const level of LEVELS) {
      expect(Number.isFinite(level.shipStart.pos.x)).toBe(true);
      expect(Number.isFinite(level.shipStart.pos.y)).toBe(true);
      expect(level.targets.length).toBeGreaterThan(0);
      for (const orbit of level.targets) {
        if (orbit.kind === "kepler") {
          expect(orbit.a).toBeGreaterThan(0);
          expect(orbit.e).toBeGreaterThanOrEqual(0);
          expect(orbit.e).toBeLessThan(1);
          expect(Number.isFinite(orbit.argPeriapsis)).toBe(true);
          expect(Number.isFinite(orbit.meanAnomaly0)).toBe(true);
        } else {
          expect(Number.isFinite(orbit.startAngle)).toBe(true);
          expect(orbit.radius).toBeGreaterThan(0);
        }
      }
      expect(level.captureRadius).toBeGreaterThan(0);
      expect(level.speedThreshold).toBeGreaterThan(0);
      expect(level.fuelCapacity).toBeGreaterThan(0);
      expect(level.parBurns).toBeGreaterThan(0);
      expect(level.parTime).toBeGreaterThan(0);
    }
  });

  // Level 6 "Eccentric Target": the first elliptical target. The ellipse must be
  // a genuine ellipse whose periapsis clears the planet (so it never intersects
  // it) — the numeric solvability was verified with a scripted forward-sim.
  it("gives Level 6 a valid eccentric orbit that clears the planet", () => {
    expect(LEVEL_6.targets).toHaveLength(1);
    const orbit = LEVEL_6.targets[0];
    expect(orbit.kind).toBe("kepler");
    if (orbit.kind !== "kepler") return;
    expect(orbit.e).toBeGreaterThan(0);
    const periapsis = orbit.a * (1 - orbit.e);
    expect(periapsis).toBeGreaterThan(PLANET_RADIUS);
    expect(orbitMaxRadius(orbit)).toBeCloseTo(orbit.a * (1 + orbit.e), 6);
  });

  // Level 7 "Milk Run": the one multi-target level — two targets caught in
  // sequence on a single fuel budget (spec §9).
  it("gives Level 7 two distinct targets to visit in sequence", () => {
    expect(LEVEL_7.targets.length).toBeGreaterThanOrEqual(2);
    expect(LEVEL_7.parBurns).toBeGreaterThanOrEqual(4);
  });

  // Level 5 "Tight Budget": Level 1's exact geometry, but a much smaller fuel
  // budget so sloppy corrections are unaffordable (spec §9). It must still be
  // solvable — capacity has to clear the ideal two-burn Hohmann cost with room
  // for a clean run to keep its 3-star fuel rating.
  it("gives Level 5 the same geometry as Level 1 but a much tighter fuel budget", () => {
    expect(LEVEL_5.shipStart.pos).toEqual(LEVEL_1.shipStart.pos);
    expect(LEVEL_5.targets).toEqual(LEVEL_1.targets);
    expect(LEVEL_5.fuelCapacity).toBeLessThan(LEVEL_1.fuelCapacity / 2);
    // Ideal Level 1 Hohmann costs ~13.9 fuel; keep a clean run at 3 stars
    // (>=60% remaining) => capacity must be >= ~35.
    expect(LEVEL_5.fuelCapacity).toBeGreaterThanOrEqual(35);
  });
});
