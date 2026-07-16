import { circularAngularSpeed } from "./orbitMath";
import { keplerState, type KeplerOrbit } from "./kepler";
import type { Vec2 } from "./vec2";

export interface CircularOrbit {
  /** Implicit tag: absent or "circular" — lets TargetOrbit narrow on `kind`. */
  kind?: "circular";
  radius: number;
  /** Angle at t=0, radians. */
  startAngle: number;
}

/**
 * A target's on-rails orbit. Both variants are propagated analytically (never
 * integrated), so they can be queried at any t — including large warp jumps —
 * without drifting. `targetPosition`/`targetVelocity` dispatch on the tag.
 */
export type TargetOrbit = CircularOrbit | KeplerOrbit;

export type { KeplerOrbit };

/**
 * Analytic "on rails" propagation: exact by construction, so the target
 * never drifts and can be queried at any t (including large warp jumps)
 * without stepping an integrator. Circular keeps its cheap trig path; the
 * eccentric case defers to Kepler propagation (see sim/kepler.ts).
 */
export function targetPosition(orbit: TargetOrbit, t: number): Vec2 {
  if (orbit.kind === "kepler") return keplerState(orbit, t).pos;
  const omega = circularAngularSpeed(orbit.radius);
  const theta = orbit.startAngle + omega * t;
  return { x: orbit.radius * Math.cos(theta), y: orbit.radius * Math.sin(theta) };
}

export function targetVelocity(orbit: TargetOrbit, t: number): Vec2 {
  if (orbit.kind === "kepler") return keplerState(orbit, t).vel;
  const omega = circularAngularSpeed(orbit.radius);
  const theta = orbit.startAngle + omega * t;
  const speed = omega * orbit.radius;
  return { x: -speed * Math.sin(theta), y: speed * Math.cos(theta) };
}

/**
 * The largest distance the orbit reaches from the planet (focus) — a circle's
 * radius, or an ellipse's apoapsis a(1+e). Used to size the camera so the whole
 * target path fits on screen.
 */
export function orbitMaxRadius(orbit: TargetOrbit): number {
  return orbit.kind === "kepler" ? orbit.a * (1 + orbit.e) : orbit.radius;
}
