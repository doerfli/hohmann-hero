// Multipliers applied to THRUST_ACCEL and FUEL_RATE together, so lowering
// burn strength for finer control costs the same total fuel per unit of
// delta-v — it just takes longer to hold.
export const BURN_STRENGTH_LEVELS = [0.25, 0.5, 1, 2];
const DEFAULT_BURN_STRENGTH_INDEX = 2; // -> 1x

/**
 * Reactive player-control state: a UI preference (not physics state), so it
 * lives outside GameState and isn't touched by resetGameState. It's $state
 * (rather than a plain field) because multiple sibling UI components — the
 * −/+ buttons and the strength label — need to reactively share one value.
 */
export const controls = $state({
  burnStrengthIndex: DEFAULT_BURN_STRENGTH_INDEX,
});

export function stepBurnStrength(delta: number): void {
  controls.burnStrengthIndex = Math.min(
    BURN_STRENGTH_LEVELS.length - 1,
    Math.max(0, controls.burnStrengthIndex + delta),
  );
}
