import type { Phase } from "./rendezvous";

/**
 * The one small reactive slice of state the HUD binds to. Updated by the
 * game loop a few times a second (see game/loop.ts) — never per physics
 * sub-step — so Svelte's reactivity never has to keep up with the canvas.
 */
export const hud = $state({
  phase: "playing" as Phase,
  fuel: 0,
  fuelCapacity: 100,
  gap: 0,
  relativeSpeed: 0,
  warpMultiplier: 1,
  /** Ship-to-target angular separation (radians), see sim/orbitMath.ts's phaseAngle. */
  phaseAngle: 0,
  /** Predicted gap/relative-speed at the trace's closest-approach point — distinct from the live gap/relativeSpeed above. */
  closestGap: 0,
  closestRelativeSpeed: 0,
});
