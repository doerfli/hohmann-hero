import { CAPTURE_RADIUS, SPEED_THRESHOLD } from "../sim/constants";
import { circularSpeed, hohmannLeadAngle } from "../sim/orbitMath";
import { orbitMaxRadius, type TargetOrbit } from "../sim/target";
import type { ShipState } from "../sim/integrator";
import { length } from "../sim/vec2";

export interface Level {
  id: string;
  name: string;
  shipStart: ShipState;
  /**
   * Targets to rendezvous with, in order. Single-target levels have one entry;
   * a "milk run" (Level 7) has several — the player captures each in sequence on
   * one fuel budget, and the level is won only after the last.
   */
  targets: TargetOrbit[];
  captureRadius: number;
  speedThreshold: number;
  fuelCapacity: number;
  /** Textbook burn count for a clean solution — scoring reference, not a limit. */
  parBurns: number;
  /** Textbook sim-seconds to rendezvous for a clean solution — scoring reference, not a limit. */
  parTime: number;
}

function shipOnCircularOrbit(radius: number, angle: number, fuel: number): ShipState {
  const speed = circularSpeed(radius);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    pos: { x: radius * cos, y: radius * sin },
    // Tangential velocity, counterclockwise.
    vel: { x: -speed * sin, y: speed * cos },
    fuel,
  };
}

const LEVEL_1_SHIP_RADIUS = 150;
const LEVEL_1_TARGET_RADIUS = 250;
const LEVEL_1_FUEL_CAPACITY = 100;

export const LEVEL_1: Level = {
  id: "level-1",
  name: "First Transfer",
  shipStart: shipOnCircularOrbit(LEVEL_1_SHIP_RADIUS, 0, LEVEL_1_FUEL_CAPACITY),
  targets: [
    {
      radius: LEVEL_1_TARGET_RADIUS,
      // Positioned so an immediate Hohmann transfer intercepts the target.
      startAngle: hohmannLeadAngle(LEVEL_1_SHIP_RADIUS, LEVEL_1_TARGET_RADIUS),
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_1_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 13,
};

// Level 1 in reverse: ship high/slow, target low/fast — teaches the
// retrograde/lowering burn. The Hohmann lead-angle formula only depends on
// the transfer ellipse's semi-major axis and the arrival radius, so it's
// equally valid descending (r1 > r2) as it is ascending.
const LEVEL_2_SHIP_RADIUS = 250;
const LEVEL_2_TARGET_RADIUS = 150;
const LEVEL_2_FUEL_CAPACITY = 60;

export const LEVEL_2: Level = {
  id: "level-2",
  name: "Drop to Descend",
  shipStart: shipOnCircularOrbit(LEVEL_2_SHIP_RADIUS, 0, LEVEL_2_FUEL_CAPACITY),
  targets: [
    {
      radius: LEVEL_2_TARGET_RADIUS,
      startAngle: hohmannLeadAngle(LEVEL_2_SHIP_RADIUS, LEVEL_2_TARGET_RADIUS),
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_2_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 13,
};

// Ship and target share the same circular orbit, target ahead. The
// "catch up by dropping lower" level — a phasing loop (drop to an ellipse,
// coast one full period of it, raise back) is the intended two-burn
// solution; the 75 degree lead leaves margin under the ~86 degree gain a
// single clean phasing loop achieves, without being trivially small.
const LEVEL_3_ORBIT_RADIUS = 150;
const LEVEL_3_FUEL_CAPACITY = 80;
const LEVEL_3_TARGET_LEAD_DEG = 75;

export const LEVEL_3: Level = {
  id: "level-3",
  name: "Slow Down to Catch Up",
  shipStart: shipOnCircularOrbit(LEVEL_3_ORBIT_RADIUS, 0, LEVEL_3_FUEL_CAPACITY),
  targets: [
    {
      radius: LEVEL_3_ORBIT_RADIUS,
      startAngle: (LEVEL_3_TARGET_LEAD_DEG * Math.PI) / 180,
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_3_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 12,
};

// Same geometry as Level 1, but the target starts at the opposite phase —
// the correct launch window is half a synodic period away, so the player
// must use time-warp to wait for it rather than burn immediately.
const LEVEL_4_SHIP_RADIUS = 150;
const LEVEL_4_TARGET_RADIUS = 250;
const LEVEL_4_FUEL_CAPACITY = 100;

export const LEVEL_4: Level = {
  id: "level-4",
  name: "Launch Window",
  shipStart: shipOnCircularOrbit(LEVEL_4_SHIP_RADIUS, 0, LEVEL_4_FUEL_CAPACITY),
  targets: [
    {
      radius: LEVEL_4_TARGET_RADIUS,
      startAngle: hohmannLeadAngle(LEVEL_4_SHIP_RADIUS, LEVEL_4_TARGET_RADIUS) + Math.PI,
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_4_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 27,
};

// Level 1's exact geometry, but a fraction of the fuel — the "tight budget"
// level (spec §9), isolating fuel discipline. An ideal two-burn Hohmann from
// r=150 to r=250 costs ~13.9 fuel; a capacity of 38 leaves a clean run above
// the 60% mark (3-star fuel rating) yet punishes sloppy corrections and makes
// a spray-and-pray solution simply run dry.
const LEVEL_5_FUEL_CAPACITY = 38;

export const LEVEL_5: Level = {
  id: "level-5",
  name: "Tight Budget",
  shipStart: shipOnCircularOrbit(LEVEL_1_SHIP_RADIUS, 0, LEVEL_5_FUEL_CAPACITY),
  targets: [
    {
      radius: LEVEL_1_TARGET_RADIUS,
      startAngle: hohmannLeadAngle(LEVEL_1_SHIP_RADIUS, LEVEL_1_TARGET_RADIUS),
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_5_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 13,
};

// First eccentric target (spec §9): the target rides an ellipse, racing through
// periapsis and lingering at apoapsis, so the player can't lean on the constant
// angular speed the circular levels taught. The intended solution is still a
// Hohmann-style two-burn — an immediate prograde burn raises the ship's apoapsis
// to the target's apoapsis (a(1+e) ≈ 304.5), and it arrives there just as the
// target does, needing only a small prograde match. meanAnomaly0 was tuned with
// a scripted forward-sim (scratch design solver) so the launch window lands at
// t=0: the optimal run closes to <0.1u gap at ~2.2 u/s relative speed. Periapsis
// (a(1−e) ≈ 115.5) dips inside the ship's start orbit but clears the planet.
const LEVEL_6_SHIP_RADIUS = 150;
const LEVEL_6_FUEL_CAPACITY = 60;

export const LEVEL_6: Level = {
  id: "level-6",
  name: "Eccentric Target",
  shipStart: shipOnCircularOrbit(LEVEL_6_SHIP_RADIUS, 0, LEVEL_6_FUEL_CAPACITY),
  targets: [
    {
      kind: "kepler",
      a: 210,
      e: 0.45,
      // Periapsis points +x, so apoapsis is at −x — where the ship's immediate
      // prograde Hohmann transfer arrives.
      argPeriapsis: 0,
      // Places the target at apoapsis exactly when the ship's transfer reaches it.
      meanAnomaly0: -0.503,
    },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_6_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 16,
};

// The capstone "milk run" (spec §9): two targets on one fuel budget. Target A is
// Level 1's proven Hohmann target at r=250; after capturing it the ship is
// circular at 250, then a return Hohmann down to r=150 catches Target B. Both
// targets' phases were tuned with a scripted forward-sim of the two back-to-back
// transfers: the ideal four-burn run closes to gap ≈ 6.4 u / rel ≈ 1.2 u/s on A
// and gap ≈ 3.0 u / rel ≈ 0.03 u/s on B for ~30 fuel total. The generous budget
// leaves room for the phasing corrections a real run needs before each transfer.
const LEVEL_7_SHIP_RADIUS = 150;
const LEVEL_7_A_RADIUS = 250;
const LEVEL_7_B_RADIUS = 150;
const LEVEL_7_FUEL_CAPACITY = 100;

export const LEVEL_7: Level = {
  id: "level-7",
  name: "Milk Run",
  shipStart: shipOnCircularOrbit(LEVEL_7_SHIP_RADIUS, 0, LEVEL_7_FUEL_CAPACITY),
  targets: [
    { radius: LEVEL_7_A_RADIUS, startAngle: hohmannLeadAngle(LEVEL_7_SHIP_RADIUS, LEVEL_7_A_RADIUS) },
    { radius: LEVEL_7_B_RADIUS, startAngle: 2.8531 },
  ],
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_7_FUEL_CAPACITY,
  parBurns: 4,
  parTime: 26,
};

export const LEVELS: Level[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6, LEVEL_7];

/** World radius (with margin) the canvas view must fit — the larger of the ship's starting orbit and the farthest reach of any target orbit (a circle's radius, or an ellipse's apoapsis). */
export function levelWorldRadius(level: Level): number {
  const targetReach = Math.max(...level.targets.map(orbitMaxRadius));
  return Math.max(length(level.shipStart.pos), targetReach) * 1.2;
}
