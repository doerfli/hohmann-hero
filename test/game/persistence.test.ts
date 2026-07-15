import { describe, expect, it } from "vitest";
import { recordResult, type SaveData } from "../../src/game/persistence";
import type { RunResult } from "../../src/game/scoring";

const levelIds = ["level-1", "level-2", "level-3"];

function emptySave(): SaveData {
  return {
    version: 1,
    levels: {
      "level-1": { bestStars: 0, bestFuelRemaining: 0, bestBurns: 0, bestTime: 0, unlocked: true },
      "level-2": { bestStars: 0, bestFuelRemaining: 0, bestBurns: 0, bestTime: 0, unlocked: false },
      "level-3": { bestStars: 0, bestFuelRemaining: 0, bestBurns: 0, bestTime: 0, unlocked: false },
    },
  };
}

function result(overrides: Partial<RunResult>): RunResult {
  return { levelId: "level-1", fuelRemaining: 50, fuelCapacity: 100, burns: 2, elapsedTime: 10, ...overrides };
}

describe("recordResult", () => {
  it("records a first win and unlocks the next level", () => {
    const next = recordResult(emptySave(), result({}), 3, levelIds);
    expect(next.levels["level-1"]).toMatchObject({ bestStars: 3, bestFuelRemaining: 50, unlocked: true });
    expect(next.levels["level-2"].unlocked).toBe(true);
    expect(next.levels["level-3"].unlocked).toBe(false);
  });

  it("keeps the previous best when a new run scores lower", () => {
    const afterFirst = recordResult(emptySave(), result({ fuelRemaining: 80 }), 3, levelIds);
    const afterSecond = recordResult(afterFirst, result({ fuelRemaining: 5 }), 1, levelIds);
    expect(afterSecond.levels["level-1"]).toMatchObject({ bestStars: 3, bestFuelRemaining: 80 });
  });

  it("replaces the best on a tie-break when fuel remaining is higher", () => {
    const afterFirst = recordResult(emptySave(), result({ fuelRemaining: 40 }), 2, levelIds);
    const afterSecond = recordResult(afterFirst, result({ fuelRemaining: 60 }), 2, levelIds);
    expect(afterSecond.levels["level-1"]).toMatchObject({ bestStars: 2, bestFuelRemaining: 60 });
  });

  it("does not unlock a level past the final one", () => {
    const next = recordResult(emptySave(), result({ levelId: "level-3" }), 1, levelIds);
    expect(next.levels["level-3"].unlocked).toBe(true);
  });
});
