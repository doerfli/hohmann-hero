import { circularAngularSpeed } from "./orbitMath";
import type { Vec2 } from "./vec2";

export interface CircularOrbit {
  radius: number;
  /** Angle at t=0, radians. */
  startAngle: number;
}

/**
 * Analytic "on rails" propagation: exact by construction, so the target
 * never drifts and can be queried at any t (including large warp jumps)
 * without stepping an integrator.
 *
 * Extension point for Phase 3: eccentric targets replace this with full
 * Kepler propagation (solve Kepler's equation for eccentric anomaly via
 * Newton-Raphson, then convert to position/velocity) behind the same
 * targetPosition/targetVelocity shape.
 */
export function targetPosition(orbit: CircularOrbit, t: number): Vec2 {
  const omega = circularAngularSpeed(orbit.radius);
  const theta = orbit.startAngle + omega * t;
  return { x: orbit.radius * Math.cos(theta), y: orbit.radius * Math.sin(theta) };
}

export function targetVelocity(orbit: CircularOrbit, t: number): Vec2 {
  const omega = circularAngularSpeed(orbit.radius);
  const theta = orbit.startAngle + omega * t;
  const speed = omega * orbit.radius;
  return { x: -speed * Math.sin(theta), y: speed * Math.cos(theta) };
}
