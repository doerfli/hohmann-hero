import { PLANET_RADIUS } from "../sim/constants";
import type { ShipState } from "../sim/integrator";
import { targetPosition, targetVelocity, type CircularOrbit } from "../sim/target";
import { distance, length, sub, lengthSq } from "../sim/vec2";

export type Phase = "playing" | "won" | "lost";

export interface RendezvousResult {
  phase: Phase;
  gap: number;
  relativeSpeed: number;
}

export function checkRendezvous(
  ship: ShipState,
  targetOrbit: CircularOrbit,
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
