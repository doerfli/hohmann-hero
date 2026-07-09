import { describe, expect, it } from "vitest";
import { DT } from "../../src/sim/constants";
import { stepShip, type ShipState } from "../../src/sim/integrator";
import { circularSpeed } from "../../src/sim/orbitMath";
import { forwardTrace } from "../../src/sim/predictor";

describe("forwardTrace matches the live coasting sim", () => {
  it("produces identical points to repeated stepShip calls with no thrust", () => {
    const radius = 150;
    const speed = circularSpeed(radius);
    const start: ShipState = { pos: { x: radius, y: 0 }, vel: { x: 0, y: speed }, fuel: 100 };
    const steps = 500;

    const traced = forwardTrace(start, DT, steps);

    let live = start;
    const livePoints = [];
    for (let i = 0; i < steps; i++) {
      live = stepShip(live, DT, 0);
      livePoints.push(live.pos);
    }

    expect(traced).toEqual(livePoints);
  });
});
