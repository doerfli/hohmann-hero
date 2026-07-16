import { MU } from "./constants";
import type { Vec2 } from "./vec2";

/**
 * An eccentric target orbit, propagated analytically ("on rails") the same way
 * CircularOrbit is — so it never drifts and can be queried at any t. Kept in a
 * separate module from target.ts to avoid an import cycle (target.ts consumes
 * this; constants.ts supplies MU).
 *
 * - `a` — semi-major axis (periapsis = a(1−e), apoapsis = a(1+e) from the focus).
 * - `e` — eccentricity in [0, 1); 0 degenerates exactly to a circular orbit.
 * - `argPeriapsis` — angle (radians) of the periapsis direction in world frame.
 * - `meanAnomaly0` — mean anomaly at t = 0 (0 ⇒ starting at periapsis).
 */
export interface KeplerOrbit {
  kind: "kepler";
  a: number;
  e: number;
  argPeriapsis: number;
  meanAnomaly0: number;
}

/** Mean motion n = sqrt(MU / a³): the average angular rate of the orbit. */
export function meanMotion(a: number): number {
  return Math.sqrt(MU / (a * a * a));
}

/**
 * Solve Kepler's equation M = E − e·sin E for the eccentric anomaly E, given
 * mean anomaly M and eccentricity e, via Newton–Raphson. Converges quadratically
 * for e < 1; a handful of iterations reaches double precision even at high e.
 */
export function solveKepler(M: number, e: number): number {
  // Start from M (exact for e = 0, a good seed otherwise).
  let E = e < 0.8 ? M : Math.PI * Math.sign(M || 1);
  for (let i = 0; i < 30; i++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const dE = f / fPrime;
    E -= dE;
    if (Math.abs(dE) < 1e-14) break;
  }
  return E;
}

/**
 * Position and velocity of a Kepler orbit at time t. Computed in the perifocal
 * frame (periapsis along +x) then rotated by argPeriapsis into the world frame.
 * Velocity comes from the analytic derivative Ė = n / (1 − e·cos E), not finite
 * differences.
 */
export function keplerState(orbit: KeplerOrbit, t: number): { pos: Vec2; vel: Vec2 } {
  const { a, e, argPeriapsis, meanAnomaly0 } = orbit;
  const n = meanMotion(a);
  const M = meanAnomaly0 + n * t;
  const E = solveKepler(M, e);

  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const b = a * Math.sqrt(1 - e * e);

  // Perifocal position: focus at origin, periapsis at +x.
  const px = a * (cosE - e);
  const py = b * sinE;

  // Perifocal velocity via Ė (Ė = n / (1 − e·cos E)).
  const eDot = n / (1 - e * cosE);
  const vx = -a * sinE * eDot;
  const vy = b * cosE * eDot;

  const cosW = Math.cos(argPeriapsis);
  const sinW = Math.sin(argPeriapsis);
  return {
    pos: { x: px * cosW - py * sinW, y: px * sinW + py * cosW },
    vel: { x: vx * cosW - vy * sinW, y: vx * sinW + vy * cosW },
  };
}
