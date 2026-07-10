import { DT, FUEL_RATE, MAX_STEPS_PER_FRAME, THRUST_ACCEL } from "../sim/constants";
import { stepShip } from "../sim/integrator";
import type { CanvasView } from "../render/canvas";
import { renderFrame } from "../render/draw";
import { checkRendezvous } from "./rendezvous";
import type { GameState } from "./state";
import { hud } from "./hud.svelte";
import { BURN_STRENGTH_LEVELS, controls } from "./controls.svelte";

// A single frame's real elapsed time is clamped before being multiplied by
// warp, so a backgrounded tab can't produce one giant catch-up burst.
const MAX_REAL_ELAPSED_MS = 250;

export function startLoop(state: GameState, view: CanvasView): () => void {
  let accumulator = 0;
  let lastTime = performance.now();
  let stopped = false;

  function frame(now: number) {
    if (stopped) return;
    const realElapsedMs = Math.min(now - lastTime, MAX_REAL_ELAPSED_MS);
    lastTime = now;

    if (state.phase === "playing") {
      accumulator += (realElapsedMs / 1000) * state.warpMultiplier;

      const strengthMultiplier = BURN_STRENGTH_LEVELS[controls.burnStrengthIndex];

      let steps = 0;
      while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
        state.ship = stepShip(
          state.ship,
          DT,
          state.burnSign,
          THRUST_ACCEL * strengthMultiplier,
          FUEL_RATE * strengthMultiplier,
        );
        state.t += DT;
        accumulator -= DT;
        steps++;

        const result = checkRendezvous(
          state.ship,
          state.level.targetOrbit,
          state.t,
          state.level.captureRadius,
          state.level.speedThreshold,
        );
        if (result.phase !== "playing") {
          state.phase = result.phase;
          hud.gap = result.gap;
          hud.relativeSpeed = result.relativeSpeed;
          break;
        }
        hud.gap = result.gap;
        hud.relativeSpeed = result.relativeSpeed;
      }
    }

    hud.phase = state.phase;
    hud.fuel = state.ship.fuel;
    hud.fuelCapacity = state.level.fuelCapacity;

    renderFrame(view, state);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return () => {
    stopped = true;
  };
}
