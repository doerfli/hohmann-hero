import { PLANET_RADIUS } from "../sim/constants";
import type { ShipState } from "../sim/integrator";
import { targetPosition, targetVelocity, type TargetOrbit } from "../sim/target";
import { distance, length, sub, lengthSq } from "../sim/vec2";

export type Phase = "playing" | "won" | "lost";

export interface RendezvousResult {
  phase: Phase;
  gap: number;
  relativeSpeed: number;
}

export function checkRendezvous(
  ship: ShipState,
  targetOrbit: TargetOrbit,
  t: number,
  captureRadius: number,
  speedThreshold: number,
): RendezvousResult {
  const tPos = targetPosition(targetOrbit, t);
  const tVel = targetVelocity(targetOrbit, t);
  const gap = distance(ship.pos, tPos);
  const relativeSpeed = length(sub(ship.vel, tVel));

  if (Math.sqrt(lengthSq(ship.pos)) <= PLANET_RADIUS) {
    return { phase: "lost", gap, relativeSpeed };
  }
  if (gap <= captureRadius && relativeSpeed <= speedThreshold) {
    return { phase: "won", gap, relativeSpeed };
  }
  if (ship.fuel <= 0) {
    return { phase: "lost", gap, relativeSpeed };
  }
  return { phase: "playing", gap, relativeSpeed };
}

export interface MultiRendezvousResult extends RendezvousResult {
  /** The (possibly advanced) index into `targets` after this check. */
  currentTargetIndex: number;
  /** True when the current target was captured this check — intermediate or final. */
  captured: boolean;
}

/**
 * Rendezvous check for a sequence of targets on one run (a "milk run"). Only the
 * *current* target counts: capturing a non-final one advances the index and the
 * run keeps playing (fuel and ship state carry over untouched); the level is
 * "won" only when the last target is captured. Crash and fuel-out still lose.
 * Pure so the advancement rule can be unit-tested apart from the render loop.
 */
export function checkMultiRendezvous(
  ship: ShipState,
  targets: TargetOrbit[],
  currentTargetIndex: number,
  t: number,
  captureRadius: number,
  speedThreshold: number,
): MultiRendezvousResult {
  const single = checkRendezvous(ship, targets[currentTargetIndex], t, captureRadius, speedThreshold);

  if (single.phase === "won") {
    const isLast = currentTargetIndex >= targets.length - 1;
    return {
      ...single,
      phase: isLast ? "won" : "playing",
      currentTargetIndex: isLast ? currentTargetIndex : currentTargetIndex + 1,
      captured: true,
    };
  }

  return { ...single, currentTargetIndex, captured: false };
}
