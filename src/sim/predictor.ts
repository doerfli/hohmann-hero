import { DT, MAX_PREVIEW_STEPS } from "./constants";
import { periodFromSemiMajorAxis, semiMajorAxis, specificEnergy } from "./orbitMath";
import type { ShipState } from "./integrator";
import { stepShip } from "./integrator";
import type { Vec2 } from "./vec2";

/**
 * Forward-simulate a ship state under gravity only (no thrust, no fuel
 * drain). Uses the exact same stepShip function as the live sim, so the
 * preview is guaranteed to match reality for identical inputs.
 */
export function forwardTrace(
  start: ShipState,
  dt: number,
  steps: number,
): Vec2[] {
  return forwardTraceStates(start, dt, steps).map((s) => s.pos);
}

/** Same as forwardTrace, but keeps the velocity at each point too. */
export function forwardTraceStates(
  start: ShipState,
  dt: number,
  steps: number,
): ShipState[] {
  let s = start;
  const states: ShipState[] = [];
  for (let i = 0; i < steps; i++) {
    s = stepShip(s, dt, 0);
    states.push(s);
  }
  return states;
}

export interface PreviewTrace {
  points: Vec2[];
  /** Velocity at each corresponding entry in points. */
  velocities: Vec2[];
  /** Whether the traced points close back into a full orbit, or the ship is on/near an escape trajectory. */
  closed: boolean;
}

/**
 * Trace one full orbit's worth of points (for a bound orbit), or an open
 * arc capped at MAX_PREVIEW_STEPS when the orbit can't be closed (e.g. an
 * over-thrusted escape trajectory).
 */
export function tracePreview(start: ShipState): PreviewTrace {
  const energy = specificEnergy(start.pos, start.vel);
  const steps =
    energy >= 0
      ? MAX_PREVIEW_STEPS
      : Math.min(Math.ceil(periodFromSemiMajorAxis(semiMajorAxis(energy)) / DT), MAX_PREVIEW_STEPS);

  const states = forwardTraceStates(start, DT, steps);
  return {
    points: states.map((s) => s.pos),
    velocities: states.map((s) => s.vel),
    closed: energy < 0 && steps < MAX_PREVIEW_STEPS,
  };
}
