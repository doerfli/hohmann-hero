import type { BurnSign, ShipState } from "../sim/integrator";
import type { Level } from "./levels";
import type { Phase } from "./rendezvous";

/**
 * Plain, non-reactive game state. The fixed-timestep loop owns and mutates
 * this every physics sub-step; the UI only reads from it (for the HUD) and
 * writes player intent (burnSign, warpMultiplier, reset) into it. Framework
 * reactivity never drives this object directly — see game/hud.svelte.ts for
 * the small reactive slice the HUD reads, and game/controls.svelte.ts for
 * the reactive slice player-control widgets (like burn strength) share.
 */
export interface GameState {
  level: Level;
  ship: ShipState;
  t: number;
  burnSign: BurnSign;
  warpMultiplier: number;
  phase: Phase;
}

export function createGameState(level: Level): GameState {
  return {
    level,
    ship: { ...level.shipStart, pos: { ...level.shipStart.pos }, vel: { ...level.shipStart.vel } },
    t: 0,
    burnSign: 0,
    warpMultiplier: 1,
    phase: "playing",
  };
}

export function resetGameState(state: GameState): void {
  const fresh = createGameState(state.level);
  state.ship = fresh.ship;
  state.t = fresh.t;
  state.burnSign = fresh.burnSign;
  state.warpMultiplier = fresh.warpMultiplier;
  state.phase = fresh.phase;
}
