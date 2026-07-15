import { describe, expect, it } from "vitest";
import { computeStars, type RunResult } from "../../src/game/scoring";

const level = { parBurns: 2, parTime: 10 };

function result(overrides: Partial<RunResult>): RunResult {
  return {
    levelId: "level-1",
    fuelRemaining: 60,
    fuelCapacity: 100,
    burns: 2,
    elapsedTime: 10,
    ...overrides,
  };
}

describe("computeStars", () => {
  it("awards 3 stars for a clean run within all pars", () => {
    expect(computeStars(result({ fuelRemaining: 70, burns: 2, elapsedTime: 12 }), level)).toBe(3);
  });

  it("caps stars at the worst-performing axis — fuel", () => {
    expect(computeStars(result({ fuelRemaining: 10, burns: 2, elapsedTime: 10 }), level)).toBe(1);
  });

  it("caps stars at the worst-performing axis — burns", () => {
    expect(computeStars(result({ fuelRemaining: 90, burns: 10, elapsedTime: 10 }), level)).toBe(1);
  });

  it("caps stars at the worst-performing axis — time", () => {
    expect(computeStars(result({ fuelRemaining: 90, burns: 2, elapsedTime: 1000 }), level)).toBe(1);
  });

  it("scores 2 stars at the middle thresholds", () => {
    expect(computeStars(result({ fuelRemaining: 40, burns: 4, elapsedTime: 20 }), level)).toBe(2);
  });

  it("never returns a score outside 0-3", () => {
    const stars = computeStars(result({ fuelRemaining: 0, burns: 100, elapsedTime: 100000 }), level);
    expect(stars).toBeGreaterThanOrEqual(0);
    expect(stars).toBeLessThanOrEqual(3);
  });
});
