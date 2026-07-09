import { CAPTURE_RADIUS, SPEED_THRESHOLD } from "../sim/constants";
import { circularSpeed, hohmannLeadAngle } from "../sim/orbitMath";
import type { CircularOrbit } from "../sim/target";
import type { ShipState } from "../sim/integrator";

export interface Level {
  id: string;
  name: string;
  shipStart: ShipState;
  targetOrbit: CircularOrbit;
  captureRadius: number;
  speedThreshold: number;
  fuelCapacity: number;
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

const SHIP_START_RADIUS = 150;
const TARGET_ORBIT_RADIUS = 250;
const FUEL_CAPACITY = 100;

export const LEVEL_1: Level = {
  id: "level-1",
  name: "First Transfer",
  shipStart: shipOnCircularOrbit(SHIP_START_RADIUS, 0, FUEL_CAPACITY),
  targetOrbit: {
    radius: TARGET_ORBIT_RADIUS,
    // Positioned so an immediate Hohmann transfer intercepts the target.
    startAngle: hohmannLeadAngle(SHIP_START_RADIUS, TARGET_ORBIT_RADIUS),
  },
  captureRadius: CAPTURE_RADIUS,
  speedThreshold: SPEED_THRESHOLD,
  fuelCapacity: FUEL_CAPACITY,
};

export const LEVELS: Level[] = [LEVEL_1];
