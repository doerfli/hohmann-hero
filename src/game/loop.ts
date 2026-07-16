import { DT, FUEL_RATE, MAX_STEPS_PER_FRAME, THRUST_ACCEL } from "../sim/constants";
import { stepShip } from "../sim/integrator";
import { findClosestApproach } from "../sim/closestApproach";
import { phaseAngle } from "../sim/orbitMath";
import { tracePreview } from "../sim/predictor";
import { targetPosition } from "../sim/target";
import type { CanvasView } from "../render/canvas";
import { renderFrame } from "../render/draw";
import { checkMultiRendezvous, type MultiRendezvousResult } from "./rendezvous";
import type { GameState } from "./state";
import { hud } from "./hud.svelte";
import { BURN_STRENGTH_LEVELS, controls } from "./controls.svelte";
import { recordLevelWin } from "./progress.svelte";
import { audio } from "../audio/audio";
import { settings } from "./settings.svelte";

// A single frame's real elapsed time is clamped before being multiplied by
// warp, so a backgrounded tab can't produce one giant catch-up burst.
const MAX_REAL_ELAPSED_MS = 250;

export function startLoop(state: GameState, view: CanvasView): () => void {
  let accumulator = 0;
  let lastTime = performance.now();
  let stopped = false;
  let prevBurnSign = state.burnSign;
  let lastRendezvous: MultiRendezvousResult | null = null;

  function frame(now: number) {
    if (stopped) return;
    const realElapsedMs = Math.min(now - lastTime, MAX_REAL_ELAPSED_MS);
    lastTime = now;

    if (state.phase === "playing") {
      if (prevBurnSign === 0 && state.burnSign !== 0) {
        state.burnCount++;
      }
      prevBurnSign = state.burnSign;

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

        lastRendezvous = checkMultiRendezvous(
          state.ship,
          state.level.targets,
          state.currentTargetIndex,
          state.t,
          state.level.captureRadius,
          state.level.speedThreshold,
        );
        // Intermediate capture on a milk run: advance to the next target,
        // keep playing (fuel carries over), and sound the same rendezvous chime.
        if (lastRendezvous.captured && lastRendezvous.phase === "playing") {
          state.currentTargetIndex = lastRendezvous.currentTargetIndex;
          audio.playChime();
        }
        if (lastRendezvous.phase !== "playing") {
          state.phase = lastRendezvous.phase;
          if (lastRendezvous.phase === "won") {
            recordLevelWin(state);
            audio.playChime();
          }
          break;
        }
      }

      // Pushed to the HUD once per frame, not per sub-step — the HUD only
      // needs to refresh a few times a second, never as fast as the canvas.
      if (lastRendezvous) {
        hud.gap = lastRendezvous.gap;
        hud.relativeSpeed = lastRendezvous.relativeSpeed;
      }
    }

    // Thrust hum tracks the actual burn state each frame (idempotent), and
    // stops the moment the level ends even though the physics block above is
    // skipped once phase leaves "playing".
    audio.setThrust(state.phase === "playing" && state.burnSign !== 0);

    const currentTarget = state.level.targets[state.currentTargetIndex];

    hud.phase = state.phase;
    hud.fuel = state.ship.fuel;
    hud.fuelCapacity = state.level.fuelCapacity;
    hud.warpMultiplier = state.warpMultiplier;
    hud.phaseAngle = phaseAngle(state.ship.pos, targetPosition(currentTarget, state.t));
    hud.targetIndex = state.currentTargetIndex;
    hud.targetCount = state.level.targets.length;

    const preview = tracePreview(state.ship);
    const closest = findClosestApproach(preview, currentTarget, state.t);
    hud.closestGap = closest.gap;
    hud.closestRelativeSpeed = closest.relativeSpeed;

    renderFrame(view, state, settings.reducedMotion);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return () => {
    stopped = true;
  };
}
