import { LEVELS } from "./levels";
import { loadSave, persistSave, recordResult } from "./persistence";
import { computeStars, type RunResult } from "./scoring";
import { summary } from "./summary.svelte";
import { switchLevel, type GameState } from "./state";

const LEVEL_IDS = LEVELS.map((level) => level.id);

/** Reactive slice for level progression: which level is active, and the loaded/persisted save data. */
export const progress = $state({
  currentLevelIndex: 0,
  save: loadSave(LEVEL_IDS),
});

/** Scores the just-completed run, persists the save, and updates the one-shot summary. Call on the "playing" -> "won" transition. */
export function recordLevelWin(state: GameState): void {
  const level = state.level;
  const result: RunResult = {
    levelId: level.id,
    fuelRemaining: state.ship.fuel,
    fuelCapacity: level.fuelCapacity,
    burns: state.burnCount,
    elapsedTime: state.t,
  };
  const stars = computeStars(result, level);

  const nextSave = recordResult(progress.save, result, stars, LEVEL_IDS);
  persistSave(nextSave);
  progress.save = nextSave;

  summary.stars = stars;
  summary.fuelRemaining = result.fuelRemaining;
  summary.burns = result.burns;
  summary.elapsedTime = result.elapsedTime;
}

/** Switches to the level at `index` if it's unlocked; no-op otherwise. */
export function selectLevel(state: GameState, index: number): void {
  const level = LEVELS[index];
  if (!level) return;
  if (!progress.save.levels[level.id]?.unlocked) return;
  progress.currentLevelIndex = index;
  switchLevel(state, level);
}

/** Dev-only escape hatch: unlocks every level (keeping any existing best scores) so all of them are reachable without playing through in order. Never exposed outside import.meta.env.DEV. */
export function unlockAllLevels(): void {
  const levels = { ...progress.save.levels };
  for (const id of LEVEL_IDS) {
    levels[id] = { ...levels[id], unlocked: true };
  }
  const nextSave = { version: 1 as const, levels };
  persistSave(nextSave);
  progress.save = nextSave;
}
