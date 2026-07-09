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
});
