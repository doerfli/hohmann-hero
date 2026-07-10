import { FUEL_RATE, MU, THRUST_ACCEL } from "./constants";
import type { Vec2 } from "./vec2";
import { add, lengthSq, normalize, scale } from "./vec2";

export interface ShipState {
  pos: Vec2;
  vel: Vec2;
  fuel: number;
}

/** -1 = retrograde, 0 = coasting, +1 = prograde */
export type BurnSign = -1 | 0 | 1;

/** Gravity toward the origin, plus thrust along thrustDir if burning. */
function acceleration(
  pos: Vec2,
  thrustDir: Vec2 | null,
  thrustAccel: number,
): Vec2 {
  const r2 = lengthSq(pos);
  const invR3 = 1 / (r2 * Math.sqrt(r2));
  const gravity = scale(pos, -MU * invR3);
  if (thrustDir === null || thrustAccel === 0) return gravity;
  return add(gravity, scale(thrustDir, thrustAccel));
}

/**
 * One fixed-timestep velocity-Verlet (kick-drift-kick) step.
 *
 * When burnSign is 0 this is exact symplectic velocity-Verlet under gravity
 * alone, which is what guarantees closed, non-drifting coasting orbits.
 * Thrust direction depends on velocity direction, which is what the step is
 * solving for, so each half-kick re-derives the thrust direction from the
 * velocity available at that half-step rather than assuming the final one.
 */
export function stepShip(
  s: ShipState,
  dt: number,
  burnSign: BurnSign,
  thrustAccel: number = THRUST_ACCEL,
  fuelRate: number = FUEL_RATE,
): ShipState {
  const signedThrustAccel = burnSign * thrustAccel;

  const dirNow = burnSign === 0 ? null : normalize(s.vel);
  const aNow = acceleration(s.pos, dirNow, signedThrustAccel);

  const velHalf = add(s.vel, scale(aNow, dt / 2));
  const posNew = add(s.pos, scale(velHalf, dt));

  const dirHalf = burnSign === 0 ? null : normalize(velHalf);
  const aNew = acceleration(posNew, dirHalf, signedThrustAccel);
  const velNew = add(velHalf, scale(aNew, dt / 2));

  return {
    pos: posNew,
    vel: velNew,
    fuel: burnSign === 0 ? s.fuel : Math.max(0, s.fuel - fuelRate * dt),
  };
}
