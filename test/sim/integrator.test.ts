import { describe, expect, it } from "vitest";
import { DT, THRUST_ACCEL } from "../../src/sim/constants";
import { stepShip, type ShipState } from "../../src/sim/integrator";
import { circularPeriod, circularSpeed, specificEnergy } from "../../src/sim/orbitMath";
import { distance, length, sub } from "../../src/sim/vec2";

function circularStartState(radius: number): ShipState {
  const speed = circularSpeed(radius);
  return {
    pos: { x: radius, y: 0 },
    vel: { x: 0, y: speed },
    fuel: 100,
  };
}

function coast(state: ShipState, steps: number): ShipState {
  let s = state;
  for (let i = 0; i < steps; i++) {
    s = stepShip(s, DT, 0);
  }
  return s;
}

describe("stepShip energy conservation (coasting)", () => {
  it("does not drift after many orbital periods", () => {
    const radius = 150;
    const start = circularStartState(radius);
    const period = circularPeriod(radius);
    const stepsPerPeriod = Math.round(period / DT);
    const startEnergy = specificEnergy(start.pos, start.vel);

    const after10 = coast(start, stepsPerPeriod * 10);
    const energy10 = specificEnergy(after10.pos, after10.vel);
    expect(Math.abs((energy10 - startEnergy) / startEnergy)).toBeLessThan(1e-6);

    const after50 = coast(after10, stepsPerPeriod * 40);
    const energy50 = specificEnergy(after50.pos, after50.vel);
    // Error must not grow with more periods — the signature of a symplectic
    // integrator, unlike Euler (spirals out) or plain RK4 (decays inward).
    expect(Math.abs((energy50 - startEnergy) / startEnergy)).toBeLessThan(1e-6);
  });
});

describe("stepShip closed orbit (coasting)", () => {
  it("returns close to the start after exactly one period", () => {
    const radius = 150;
    const start = circularStartState(radius);
    const period = circularPeriod(radius);
    const steps = Math.round(period / DT);

    const after = coast(start, steps);

    expect(distance(after.pos, start.pos) / radius).toBeLessThan(1e-3);
    const speed = circularSpeed(radius);
    expect(length(sub(after.vel, start.vel)) / speed).toBeLessThan(1e-3);
  });
});

describe("stepShip thrust sanity", () => {
  it("increases speed by roughly thrustAccel * duration when burning prograde", () => {
    const radius = 150;
    const start = circularStartState(radius);
    const durationSteps = 12; // 0.1s at DT=1/120 — short enough that gravity's
    // own contribution to |v| (from the orbit reshaping) stays small relative
    // to the thrust-driven change, so this remains a useful sanity check.
    let s = start;
    for (let i = 0; i < durationSteps; i++) {
      s = stepShip(s, DT, 1);
    }
    const expectedDelta = THRUST_ACCEL * (durationSteps * DT);
    const actualDelta = length(s.vel) - length(start.vel);
    expect(Math.abs(actualDelta - expectedDelta) / expectedDelta).toBeLessThan(0.1);
  });
});
