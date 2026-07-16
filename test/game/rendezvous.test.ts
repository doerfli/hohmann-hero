import { describe, expect, it } from "vitest";
import { checkMultiRendezvous } from "../../src/game/rendezvous";
import { targetPosition, targetVelocity, type TargetOrbit } from "../../src/sim/target";
import type { ShipState } from "../../src/sim/integrator";

const targets: TargetOrbit[] = [
  { radius: 250, startAngle: 0 },
  { radius: 150, startAngle: Math.PI / 2 },
];

/** A ship sitting exactly on a target (zero gap, zero relative speed → capture). */
function shipOn(orbit: TargetOrbit, t: number, fuel = 100): ShipState {
  return { pos: targetPosition(orbit, t), vel: targetVelocity(orbit, t), fuel };
}

describe("checkMultiRendezvous", () => {
  it("advances the index and keeps playing when a non-final target is captured", () => {
    const r = checkMultiRendezvous(shipOn(targets[0], 0), targets, 0, 0, 15, 9);
    expect(r.phase).toBe("playing");
    expect(r.captured).toBe(true);
    expect(r.currentTargetIndex).toBe(1);
  });

  it("wins only when the final target is captured", () => {
    const r = checkMultiRendezvous(shipOn(targets[1], 0), targets, 1, 0, 15, 9);
    expect(r.phase).toBe("won");
    expect(r.captured).toBe(true);
    expect(r.currentTargetIndex).toBe(1);
  });

  it("checks against the current target, not earlier ones", () => {
    // Ship sits on target[0] but is already pursuing target[1]: no capture.
    const r = checkMultiRendezvous(shipOn(targets[0], 0), targets, 1, 0, 15, 9);
    expect(r.phase).toBe("playing");
    expect(r.captured).toBe(false);
    expect(r.currentTargetIndex).toBe(1);
  });

  it("keeps playing (no capture) when far from the current target", () => {
    const ship: ShipState = { pos: { x: 0, y: 500 }, vel: { x: 0, y: 0 }, fuel: 50 };
    const r = checkMultiRendezvous(ship, targets, 0, 0, 15, 9);
    expect(r.phase).toBe("playing");
    expect(r.captured).toBe(false);
    expect(r.currentTargetIndex).toBe(0);
  });

  it("loses on running out of fuel before all targets are captured", () => {
    const ship: ShipState = { pos: { x: 0, y: 500 }, vel: { x: 0, y: 0 }, fuel: 0 };
    const r = checkMultiRendezvous(ship, targets, 0, 0, 15, 9);
    expect(r.phase).toBe("lost");
    expect(r.currentTargetIndex).toBe(0);
  });

  it("wins immediately on a single-target level", () => {
    const single: TargetOrbit[] = [{ radius: 250, startAngle: 0 }];
    const r = checkMultiRendezvous(shipOn(single[0], 0), single, 0, 0, 15, 9);
    expect(r.phase).toBe("won");
    expect(r.currentTargetIndex).toBe(0);
  });
});
