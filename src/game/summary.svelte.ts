import type { Stars } from "./scoring";

/**
 * One-shot snapshot of the most recently completed run, for the end-of-level
 * summary. Deliberately separate from hud.svelte.ts: hud is live telemetry
 * overwritten every frame, this is written once per win and left alone.
 */
export const summary = $state({
  stars: 0 as Stars,
  fuelRemaining: 0,
  burns: 0,
  elapsedTime: 0,
});
