import { describe, expect, it } from "vitest";
import { phaseAngle } from "../../src/sim/orbitMath";

describe("phaseAngle", () => {
  it("is zero when ship and target are at the same angle", () => {
    expect(phaseAngle({ x: 100, y: 0 }, { x: 250, y: 0 })).toBeCloseTo(0, 10);
  });

  it("is positive when the target leads the ship counterclockwise", () => {
    // Target 90 degrees ahead (counterclockwise) of the ship.
    expect(phaseAngle({ x: 150, y: 0 }, { x: 0, y: 250 })).toBeCloseTo(Math.PI / 2, 10);
  });

  it("is negative when the target trails the ship", () => {
    // Target 90 degrees behind (clockwise) of the ship.
    expect(phaseAngle({ x: 150, y: 0 }, { x: 0, y: -250 })).toBeCloseTo(-Math.PI / 2, 10);
  });

  it("normalizes the wraparound boundary to a value with magnitude pi", () => {
    const diff = phaseAngle({ x: 150, y: 0 }, { x: -250, y: 0 });
    expect(Math.abs(diff)).toBeCloseTo(Math.PI, 10);
  });
});
