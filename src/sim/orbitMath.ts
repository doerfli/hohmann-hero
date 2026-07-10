import { MU } from "./constants";
import type { Vec2 } from "./vec2";
import { lengthSq } from "./vec2";

/** Angular speed of a circular orbit at radius r. */
export function circularAngularSpeed(r: number): number {
  return Math.sqrt(MU / (r * r * r));
}

/** Tangential speed of a circular orbit at radius r. */
export function circularSpeed(r: number): number {
  return Math.sqrt(MU / r);
}

/** Orbital period of a circular orbit at radius r. */
export function circularPeriod(r: number): number {
  return (2 * Math.PI) / circularAngularSpeed(r);
}

/** Specific orbital energy (vis-viva): negative = bound ellipse, >=0 = escape. */
export function specificEnergy(pos: Vec2, vel: Vec2): number {
  const r = Math.sqrt(lengthSq(pos));
  return lengthSq(vel) / 2 - MU / r;
}

/** Semi-major axis from specific energy. Only meaningful when energy < 0. */
export function semiMajorAxis(energy: number): number {
  return -MU / (2 * energy);
}

/** Orbital period from semi-major axis (bound orbits only). */
export function periodFromSemiMajorAxis(a: number): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / MU);
}

/**
 * Angle (radians) the target must lead the ship by, at the moment a Hohmann
 * transfer burn starts from circular radius r1 toward circular radius r2, so
 * the ship and target arrive at the transfer ellipse's far apse together.
 * Independent of MU — depends only on the radius ratio.
 */
export function hohmannLeadAngle(r1: number, r2: number): number {
  const transferSemiMajorAxis = (r1 + r2) / 2;
  const targetTravel = Math.PI * Math.pow(transferSemiMajorAxis / r2, 1.5);
  return Math.PI - targetTravel;
}

/** Signed angular separation from ship to target, normalized to (-π, π]. */
export function phaseAngle(shipPos: Vec2, targetPos: Vec2): number {
  const shipAngle = Math.atan2(shipPos.y, shipPos.x);
  const targetAngle = Math.atan2(targetPos.y, targetPos.x);
  let diff = (targetAngle - shipAngle) % (2 * Math.PI);
  if (diff <= -Math.PI) diff += 2 * Math.PI;
  else if (diff > Math.PI) diff -= 2 * Math.PI;
  return diff;
}
