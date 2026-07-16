import { CAPTURE_RADIUS, SPEED_THRESHOLD } from "../sim/constants";
import { circularSpeed, hohmannLeadAngle } from "../sim/orbitMath";
import type { CircularOrbit } from "../sim/target";
import type { ShipState } from "../sim/integrator";
import { length } from "../sim/vec2";

export interface Level {
  id: string;
  name: string;
  shipStart: ShipState;
  targetOrbit: CircularOrbit;
  captureRadius: number;
  speedThreshold: number;
  fuelCapacity: number;
  /** Textbook burn count for a clean two-burn solution — scoring reference, not a limit. */
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
  targetOrbit: {
    radius: LEVEL_1_TARGET_RADIUS,
    // Positioned so an immediate Hohmann transfer intercepts the target.
    startAngle: hohmannLeadAngle(LEVEL_1_SHIP_RADIUS, LEVEL_1_TARGET_RADIUS),
  },
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
  targetOrbit: {
    radius: LEVEL_2_TARGET_RADIUS,
    startAngle: hohmannLeadAngle(LEVEL_2_SHIP_RADIUS, LEVEL_2_TARGET_RADIUS),
  },
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
  targetOrbit: {
    radius: LEVEL_3_ORBIT_RADIUS,
    startAngle: (LEVEL_3_TARGET_LEAD_DEG * Math.PI) / 180,
  },
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
  targetOrbit: {
    radius: LEVEL_4_TARGET_RADIUS,
    startAngle: hohmannLeadAngle(LEVEL_4_SHIP_RADIUS, LEVEL_4_TARGET_RADIUS) + Math.PI,
  },
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
  targetOrbit: {
    radius: LEVEL_1_TARGET_RADIUS,
    startAngle: hohmannLeadAngle(LEVEL_1_SHIP_RADIUS, LEVEL_1_TARGET_RADIUS),
  },
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: LEVEL_5_FUEL_CAPACITY,
  parBurns: 2,
  parTime: 13,
};

export const LEVELS: Level[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5];

/** World radius (with margin) the canvas view must fit — the larger of the ship's starting orbit and the target orbit. */
export function levelWorldRadius(level: Level): number {
  return Math.max(length(level.shipStart.pos), level.targetOrbit.radius) * 1.2;
}
