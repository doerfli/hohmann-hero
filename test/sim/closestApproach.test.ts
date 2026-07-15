import { describe, expect, it } from "vitest";
import { findClosestApproach } from "../../src/sim/closestApproach";
import type { PreviewTrace } from "../../src/sim/predictor";
import { circularAngularSpeed, circularSpeed } from "../../src/sim/orbitMath";

describe("findClosestApproach", () => {
  it("picks the trace point nearest the target's position at the matching time, not just the first/last point", () => {
    const radius = 300;
    const omega = circularAngularSpeed(radius);
    const dt = 1;
    const tNow = 0;

    // Four synthetic (non-orbit) trace points spread along the x-axis so
    // distance-to-target is easy to reason about by hand.
    const preview: PreviewTrace = {
      points: [
        { x: 100, y: 0 },
        { x: 200, y: 0 },
        { x: 300, y: 0 },
        { x: 400, y: 0 },
      ],
      velocities: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
      ],
      closed: false,
    };

    // futureT for index 2 is tNow + (2+1)*dt = 3. Choose startAngle so the
    // target sits at exactly (300, 0) — coincident with points[2] — at t=3.
    const coincideT = tNow + 3 * dt;
    const startAngle = -omega * coincideT;

    const result = findClosestApproach(preview, { radius, startAngle }, tNow, dt);

    expect(result.pointIndex).toBe(2);
    expect(result.gap).toBeCloseTo(0, 6);

    const targetSpeed = circularSpeed(radius);
    expect(result.relativeSpeed).toBeCloseTo(Math.abs(1 - targetSpeed), 6);
  });

  it("returns an empty-trace sentinel instead of throwing when the preview has no points", () => {
    const preview: PreviewTrace = { points: [], velocities: [], closed: false };
    const result = findClosestApproach(preview, { radius: 150, startAngle: 0 }, 0);
    expect(result.pointIndex).toBe(-1);
    expect(result.gap).toBe(Infinity);
  });
});
