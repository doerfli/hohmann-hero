import type { RunResult, Stars } from "./scoring";

export const SAVE_KEY = "hohmann-hero:v1";

export interface LevelSave {
  bestStars: Stars;
  bestFuelRemaining: number;
  bestBurns: number;
  bestTime: number;
  unlocked: boolean;
}

export interface SaveData {
  version: 1;
  levels: Record<string, LevelSave>;
}

function defaultSave(levelIds: string[]): SaveData {
  const levels: Record<string, LevelSave> = {};
  levelIds.forEach((id, index) => {
    levels[id] = {
      bestStars: 0,
      bestFuelRemaining: 0,
      bestBurns: 0,
      bestTime: 0,
      unlocked: index === 0,
    };
  });
  return { version: 1, levels };
}

/**
 * Loads the save, falling back to a fresh default (only the first level
 * unlocked) on a missing key, parse failure, or version mismatch — this is
 * the whole v1 migration story; `version` is reserved so a v2 shape change
 * can add a real migration instead of discarding old saves.
 */
export function loadSave(levelIds: string[]): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave(levelIds);

    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || typeof parsed.levels !== "object" || parsed.levels === null) {
      return defaultSave(levelIds);
    }

    // Merge onto a fresh default so levels added since the save was written
    // (or ids that no longer exist) don't leave holes or stale entries.
    const fresh = defaultSave(levelIds);
    for (const id of levelIds) {
      if (parsed.levels[id]) fresh.levels[id] = parsed.levels[id];
    }
    return fresh;
  } catch {
    return defaultSave(levelIds);
  }
}

export function persistSave(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

/**
 * Pure transform: given a completed run and its star score, returns updated
 * save data with the level's best-run bumped (only if this run is better)
 * and the next level unlocked. Any win unlocks the next level regardless of
 * star count — stars are a replay/optimization incentive, not a gate.
 */
export function recordResult(save: SaveData, result: RunResult, stars: Stars, levelIds: string[]): SaveData {
  const levels = { ...save.levels };
  const current = levels[result.levelId] ?? defaultSave(levelIds).levels[result.levelId];

  const isBetter =
    stars > current.bestStars || (stars === current.bestStars && result.fuelRemaining > current.bestFuelRemaining);

  levels[result.levelId] = {
    bestStars: isBetter ? stars : current.bestStars,
    bestFuelRemaining: isBetter ? result.fuelRemaining : current.bestFuelRemaining,
    bestBurns: isBetter ? result.burns : current.bestBurns,
    bestTime: isBetter ? result.elapsedTime : current.bestTime,
    unlocked: true,
  };

  const nextId = levelIds[levelIds.indexOf(result.levelId) + 1];
  if (nextId && levels[nextId]) {
    levels[nextId] = { ...levels[nextId], unlocked: true };
  }

  return { version: 1, levels };
}
