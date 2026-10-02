import { describe, expect, it } from "vitest";
import { DEFAULTS, SCENARIOS } from "./types";
import {
  density,
  LIGHT_YEARS_PER_KPC,
  overlap,
  probability,
  radialNormalization,
  receiver,
  temporalExposure,
  threshold,
  validate,
  visitProbability,
} from "./physics";
import { simulate } from "./simulation";
const base = { ...DEFAULTS, samples: 12000 };
describe("Physical units and receiver", () => {
  it("converts kiloparsecs to Julian light-years", () =>
    expect(LIGHT_YEARS_PER_KPC).toBeCloseTo(3261.563777, 5));
  it("obeys square-root power, bandwidth and integration scaling", () => {
    const d = receiver(base).horizon;
    expect(receiver({ ...base, eirp: base.eirp * 4 }).horizon / d).toBeCloseTo(
      2,
      12,
    );
    expect(
      receiver({ ...base, bandwidth: base.bandwidth * 16 }).horizon / d,
    ).toBeCloseTo(0.5, 12);
    expect(
      receiver({ ...base, integration: base.integration * 16 }).horizon / d,
    ).toBeCloseTo(2, 12);
    expect(receiver({ ...base, frequency: 4 }).horizon).toBe(0);
  });
  it("uses integrated flux units with two polarizations", () =>
    expect(receiver(base).fluxThreshold).toBeCloseTo(
      (10 * 10 * 1e-26) / Math.sqrt(600),
      38,
    ));
});
describe("Arrival and analytic time marginalization", () => {
  it("allows extinct sources to arrive now", () => {
    const birth = -10000,
      L = 1000,
      delay = 9500;
    expect(birth + L).toBeLessThan(0);
    expect(overlap(birth + delay, birth + delay + L, 50)).toBe(50);
  });
  it("requires a complete integration within the overlap", () =>
    expect(visitProbability(1e-9, base)).toBe(0));
  it("matches independent fine midpoint integration, including history boundaries", () => {
    for (const L of [3, 40, 100])
      for (const T of [10, 50])
        for (const delay of [0, 35, 120]) {
          const p = {
            ...base,
            lifetime: L,
            history: 110,
            visits: 0.3,
            integration: 3e6,
          };
          const lo = Math.max(-L, -p.history + delay),
            hi = T;
          let sum = 0;
          const n = 40000,
            dx = (hi - lo) / n;
          if (hi > lo)
            for (let i = 0; i < n; i++) {
              const a = lo + (i + 0.5) * dx;
              sum += visitProbability(overlap(a, a + L, T), p) * dx;
            }
          expect(temporalExposure(delay, T, p)).toBeCloseTo(sum, 5);
        }
  });
  it("approaches the exact ideal-survey stationary result L+T", () => {
    const p = { ...base, visits: 1e9, integration: 1e-6 };
    expect(temporalExposure(40000, 50, p)).toBeCloseTo(p.lifetime + 50, 5);
  });
  it("is translation invariant in stationary history and vanishes beyond finite history", () => {
    expect(temporalExposure(50000, 50, base)).toBeCloseTo(
      temporalExposure(0, 50, base),
      12,
    );
    expect(temporalExposure(2000000, 50, base)).toBe(0);
    expect(temporalExposure(0, 0, base)).toBe(0);
  });
});
describe("Spatial population normalization", () => {
  it("normalizes the uniform disk to πR²", () =>
    expect(radialNormalization(base, "U")).toBeCloseTo(
      Math.PI * base.radius ** 2,
      10,
    ));
  it("matches the closed-form center-favored radial integral", () => {
    const k = 1 / base.scale + 1 / base.centerScale,
      R = base.radius;
    const expected =
      (2 * Math.PI * (1 - Math.exp(-k * R) * (1 + k * R))) / (k * k);
    expect(radialNormalization(base, "A")).toBeCloseTo(expected, 9);
  });
  it("matches the specified habitable-ring and center-suppressed functions", () => {
    expect(density(8, base, "B")).toBeCloseTo(Math.exp(-8 / 2.6), 14);
    expect(density(5, base, "C")).toBeCloseTo(
      Math.exp(-5 / 2.6) * (1 - Math.exp(-1)),
      14,
    );
    expect(density(16, base)).toBe(0);
    for (const s of SCENARIOS)
      expect(radialNormalization(base, s.id)).toBeGreaterThan(0);
  });
});
describe("Poisson inverse and Monte Carlo estimator", () => {
  it("matches an exact thin uniform disk benchmark without sampling noise", () => {
    const p = {
      ...base,
      scenario: "U" as const,
      thickness: 0,
      eirp: 1e13,
      beam: 1,
      sky: 1,
      frequencyCoverage: 1,
    };
    const r = simulate(p),
      e = r.estimates[3];
    const mass = r.horizon ** 2 / p.radius ** 2;
    expect(e.reachable).toBeCloseTo(mass, 12);
    expect(e.alpha).toBeCloseTo(
      (mass * temporalExposure(0, p.window, p)) / p.lifetime,
      12,
    );
  });
  it("resolves a small 3D sensitivity sphere, checked against analytic volume", () => {
    const p = { ...base, samples: 60000, scenario: "U" as const, eirp: 1e10 };
    const r = simulate(p),
      e = r.estimates[3];
    const exact = (4 * r.horizon ** 3) / (3 * p.radius ** 2 * p.thickness);
    expect(Math.abs(e.reachable / exact - 1)).toBeLessThan(0.015);
  });
  it("inverts the probability and handles impossible detection", () => {
    for (const target of [0.5, 0.9, 0.99])
      expect(probability(threshold(target, 0.0002), 0.0002)).toBeCloseTo(
        target,
        14,
      );
    expect(threshold(0.9, 0)).toBe(Infinity);
    expect(probability(0, 100)).toBe(0);
    expect(probability(1, 1e-18)).toBeGreaterThan(0);
  });
  it("is reproducible and keeps lifetime-after-emission out of detection estimates", () => {
    const a = simulate(base),
      b = simulate({ ...base, postLife: 100000 });
    expect(a.estimates).toEqual(b.estimates);
    const c = simulate(base);
    expect(a.civilizations).toEqual(c.civilizations);
    expect(a.estimates).toEqual(c.estimates);
  });
  it("scales linearly with independent source masks and grows with time", () => {
    const a = simulate(base),
      b = simulate({ ...base, sky: base.sky / 2 });
    for (let i = 0; i < 4; i++)
      expect(b.estimates[i].alpha).toBeCloseTo(a.estimates[i].alpha / 2, 14);
    for (let i = 1; i < a.curve.length; i++)
      expect(a.curve[i].probability).toBeGreaterThanOrEqual(
        a.curve[i - 1].probability,
      );
  });
  it("returns zero for zero coverage, duty, visits, power or out-of-band frequency", () => {
    for (const patch of [
      { sky: 0 },
      { duty: 0 },
      { visits: 0 },
      { eirp: 0 },
      { frequency: 3 },
    ]) {
      const r = simulate({ ...base, ...patch });
      expect(r.estimates.every((e) => e.alpha === 0)).toBe(true);
      expect(r.civilizations.some((c) => c.detected)).toBe(false);
    }
  });
  it("validates physical domains", () => {
    expect(validate(base)).toEqual([]);
    for (const patch of [
      { history: 1 },
      { sky: 2 },
      { lifetime: 0 },
      { sun: 20 },
      { ringRadius: 20 },
      { bandMax: 0.1 },
      { seed: NaN },
      { population: -1 },
      { eirp: 1e100 },
    ])
      expect(validate({ ...base, ...patch }).length).toBeGreaterThan(0);
  });
});
