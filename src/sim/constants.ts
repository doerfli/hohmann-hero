// Reference tuning point: a comfortable mid-screen circular orbit should
// have a period of a few seconds at 1x warp (per the game spec, §15).
const REFERENCE_ORBIT_RADIUS = 150;
const REFERENCE_ORBIT_PERIOD = 8; // seconds (doubled to halve circular orbit speeds)

// GM of the planet, derived so a circular orbit at REFERENCE_ORBIT_RADIUS has
// period REFERENCE_ORBIT_PERIOD: T = 2*pi*sqrt(r^3/mu) => mu = 4*pi^2*r^3/T^2
export const MU =
  (4 * Math.PI * Math.PI * REFERENCE_ORBIT_RADIUS ** 3) /
  (REFERENCE_ORBIT_PERIOD * REFERENCE_ORBIT_PERIOD);

// Fixed physics timestep. Never scaled by time-warp — warp adds sub-steps.
export const DT = 1 / 120;

// Safety cap on physics sub-steps per rendered frame, so a backgrounded tab
// or an extreme warp can't freeze the loop trying to catch up.
export const MAX_STEPS_PER_FRAME = 2000;

// Cap on how many points the forward predictor will trace when an orbit
// can't be closed within a reasonable number of steps (e.g. near-escape).
export const MAX_PREVIEW_STEPS = 2000;

export const PLANET_RADIUS = 30;

// Acceleration applied while a burn button is held, along/against velocity.
export const THRUST_ACCEL = 25;

// Fuel consumed per second of a burn being held.
export const FUEL_RATE = 20;

// Win condition thresholds (§8, §15 of the spec).
export const CAPTURE_RADIUS = 15;
export const SPEED_THRESHOLD = 9;

export const SHIP_RENDER_RADIUS = 5;
