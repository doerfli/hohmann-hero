import type { Level } from "./levels";

export type Stars = 0 | 1 | 2 | 3;

export interface RunResult {
  levelId: string;
  fuelRemaining: number;
  fuelCapacity: number;
  burns: number;
  /** Sim-time (state.t) at the moment of win — fixed-DT accumulated, so it's identical regardless of time-warp used. */
  elapsedTime: number;
}

/**
 * Three independent axes (fuel left, burns taken, time elapsed), each scored
 * against a level's par values, final score = the worst of the three — so a
 * 3-star run has to be clean on every axis, not just fuel-rich.
 */
export function computeStars(result: RunResult, level: Pick<Level, "parBurns" | "parTime">): Stars {
  const fuelFraction = result.fuelRemaining / result.fuelCapacity;
  const fuelStars = fuelFraction >= 0.6 ? 3 : fuelFraction >= 0.3 ? 2 : 1;

  const burnStars = result.burns <= level.parBurns ? 3 : result.burns <= level.parBurns + 2 ? 2 : 1;

  const timeStars = result.elapsedTime <= level.parTime * 1.5 ? 3 : result.elapsedTime <= level.parTime * 3 ? 2 : 1;

  return Math.min(fuelStars, burnStars, timeStars) as Stars;
}
