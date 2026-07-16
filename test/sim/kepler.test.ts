import { describe, expect, it } from "vitest";
import { solveKepler, keplerState, type KeplerOrbit } from "../../src/sim/kepler";
import { targetPosition, targetVelocity, type CircularOrbit } from "../../src/sim/target";
import { periodFromSemiMajorAxis, specificEnergy, semiMajorAxis } from "../../src/sim/orbitMath";

describe("solveKepler", () => {
  it("solves Kepler's equation M = E - e·sin E for a range of M and e", () => {
    for (const e of [0, 0.1, 0.3, 0.6, 0.9]) {
      for (let k = 0; k < 12; k++) {
        const M = -Math.PI + (k / 11) * 2 * Math.PI;
        const E = solveKepler(M, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(M, 10);
      }
    }
  });

  it("returns E = M when the orbit is circular (e = 0)", () => {
    expect(solveKepler(1.234, 0)).toBeCloseTo(1.234, 12);
  });
});

describe("keplerState", () => {
  const a = 200;
  const e = 0.4;
  const kepler: KeplerOrbit = { kind: "kepler", a, e, argPeriapsis: 0.7, meanAnomaly0: 0.2 };

  it("matches the circular analytic path when e = 0 (continuity with CircularOrbit)", () => {
    const radius = 180;
    const startAngle = 0.9;
    const circular: CircularOrbit = { radius, startAngle };
    const equivalent: KeplerOrbit = {
      kind: "kepler",
      a: radius,
      e: 0,
      argPeriapsis: 0,
      meanAnomaly0: startAngle,
    };
    for (const t of [0, 1.5, 4, 9.3]) {
      const kp = keplerState(equivalent, t);
      const cp = targetPosition(circular, t);
      const cv = targetVelocity(circular, t);
      expect(kp.pos.x).toBeCloseTo(cp.x, 8);
      expect(kp.pos.y).toBeCloseTo(cp.y, 8);
      expect(kp.vel.x).toBeCloseTo(cv.x, 8);
      expect(kp.vel.y).toBeCloseTo(cv.y, 8);
    }
  });

  it("is periodic over one orbital period 2π/n", () => {
    const period = periodFromSemiMajorAxis(a);
    const at0 = keplerState(kepler, 3);
    const atT = keplerState(kepler, 3 + period);
    expect(atT.pos.x).toBeCloseTo(at0.pos.x, 6);
    expect(atT.pos.y).toBeCloseTo(at0.pos.y, 6);
    expect(atT.vel.x).toBeCloseTo(at0.vel.x, 6);
    expect(atT.vel.y).toBeCloseTo(at0.vel.y, 6);
  });

  it("conserves specific energy and semi-major axis along the propagated path", () => {
    for (const t of [0, 2, 5, 11, 17]) {
      const { pos, vel } = keplerState(kepler, t);
      const energy = specificEnergy(pos, vel);
      expect(semiMajorAxis(energy)).toBeCloseTo(a, 4);
    }
  });

  it("places periapsis at a(1−e) and apoapsis at a(1+e) from the focus", () => {
    // meanAnomaly0 = 0 => starts at periapsis; half a period later => apoapsis.
    const orbit: KeplerOrbit = { kind: "kepler", a, e, argPeriapsis: 1.1, meanAnomaly0: 0 };
    const period = periodFromSemiMajorAxis(a);
    const peri = keplerState(orbit, 0);
    const apo = keplerState(orbit, period / 2);
    expect(Math.hypot(peri.pos.x, peri.pos.y)).toBeCloseTo(a * (1 - e), 4);
    expect(Math.hypot(apo.pos.x, apo.pos.y)).toBeCloseTo(a * (1 + e), 4);
  });
});
