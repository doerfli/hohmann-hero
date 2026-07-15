import { DT } from "./constants";
import type { PreviewTrace } from "./predictor";
import { targetPosition, targetVelocity, type CircularOrbit } from "./target";
import { distance, length, sub } from "./vec2";

export interface ClosestApproachResult {
  gap: number;
  relativeSpeed: number;
  atTime: number;
  pointIndex: number;
}

/**
 * Scans a predicted ship trace against the target's analytic position over
 * the same span of time, and returns the point of nearest approach. Shared by
 * the canvas marker (render/draw.ts) and the HUD readout so both report the
 * same number instead of computing it twice with room to drift apart.
 */
export function findClosestApproach(
  preview: PreviewTrace,
  targetOrbit: CircularOrbit,
  tNow: number,
  dt: number = DT,
): ClosestApproachResult {
  const { points, velocities } = preview;
  if (points.length === 0) {
    return { gap: Infinity, relativeSpeed: 0, atTime: tNow, pointIndex: -1 };
  }

  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const futureT = tNow + (i + 1) * dt;
    const targetAtT = targetPosition(targetOrbit, futureT);
    const d = distance(points[i], targetAtT);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }

  const bestT = tNow + (bestIndex + 1) * dt;
  const relativeSpeed = length(sub(velocities[bestIndex], targetVelocity(targetOrbit, bestT)));
  return { gap: bestDist, relativeSpeed, atTime: bestT, pointIndex: bestIndex };
}
