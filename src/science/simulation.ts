import type {
  Civilization,
  Estimate,
  Parameters,
  SimulationResult,
} from "./types";
import { SCENARIOS } from "./types";
import {
  density,
  LIGHT_YEARS_PER_KPC,
  overlap,
  probability,
  radialNormalization,
  receiver,
  temporalExposure,
  validate,
  visitProbability,
} from "./physics";
import { poisson, random } from "./random";

export function generateCatalog(p: Parameters, horizon: number) {
  const rng = random(p.seed ^ 0xbeef);
  const maxDelay =
    Math.hypot(p.radius + p.sun, p.thickness / 2) * LIGHT_YEARS_PER_KPC;
  const earliest = Math.max(
    -p.history,
    Math.min(-p.lifetime - maxDelay, -p.lifetime - p.postLife),
  );
  const expected = (p.population / p.lifetime) * (p.window - earliest);
  const realized = poisson(expected, rng);
  const count = Math.min(1200, realized < 0 ? Math.round(expected) : realized);
  const cdf = [0];
  let total = 0;
  const bins = 4096;
  for (let i = 0; i < bins; i++) {
    const r = ((i + 0.5) * p.radius) / bins;
    total += r * density(r, p);
    cdf.push(total);
  }
  const civilizations: Civilization[] = [];
  for (let i = 0; i < count; i++) {
    const u = rng() * total;
    let lo = 0,
      hi = bins;
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (cdf[mid] < u) lo = mid;
      else hi = mid;
    }
    const radius =
      ((lo + (u - cdf[lo]) / (cdf[hi] - cdf[lo])) * p.radius) / bins;
    const angle = rng() * Math.PI * 2,
      x = radius * Math.cos(angle),
      y = radius * Math.sin(angle),
      z = (rng() - 0.5) * p.thickness;
    const distance = Math.hypot(x - p.sun, y, z),
      birth = earliest + rng() * (p.window - earliest);
    const arrivalStart = birth + distance * LIGHT_YEARS_PER_KPC,
      arrivalEnd = arrivalStart + p.lifetime;
    const duration = overlap(arrivalStart, arrivalEnd, p.window),
      inRange = distance <= horizon && horizon > 0,
      beamHits = rng() < p.beam;
    const sky = rng() < p.sky,
      frequency = rng() < p.frequencyCoverage,
      visit = rng() < visitProbability(duration, p);
    const detected = inRange && beamHits && sky && frequency && visit;
    const reason = detected
      ? "Detected during observation window"
      : !duration
        ? "Arrival outside observation window"
        : !inRange
          ? "Below sensitivity or outside receiver band"
          : !beamHits
            ? "Beam misses Earth"
            : !sky
              ? "Outside surveyed sky"
              : !frequency
                ? "Frequency not sampled"
                : "No successful observing visit";
    civilizations.push({
      id: i + 1,
      x,
      y,
      z,
      distance,
      birth,
      emissionEnd: birth + p.lifetime,
      death: birth + p.lifetime + p.postLife,
      arrivalStart,
      arrivalEnd,
      overlap: duration,
      inRange,
      beamHits,
      detected,
      reason,
    });
  }
  return {
    civilizations,
    catalogPopulation: realized < 0 ? expected : realized,
  };
}

export function simulate(
  p: Parameters,
  progress: (value: number) => void = () => {},
): SimulationResult {
  const errors = validate(p);
  if (errors.length) throw new Error(errors.join(" "));
  const start = performance.now(),
    rng = random(p.seed),
    { horizon, fluxThreshold } = receiver(p);
  const norms = SCENARIOS.map((s) => radialNormalization(p, s.id));
  const sums = [0, 0, 0, 0],
    squares = [0, 0, 0, 0],
    mass = [0, 0, 0, 0];
  const rhoMax = Math.min(horizon, p.radius + p.sun),
    zMax = Math.min(horizon, p.thickness / 2);
  const volumeFactor =
    Math.PI *
    rhoMax *
    rhoMax *
    (p.thickness > 0 ? (2 * zMax) / p.thickness : 1);
  const mark = p.beam * p.sky * p.frequencyCoverage;
  const selected = SCENARIOS.findIndex((s) => s.id === p.scenario);
  const curveTimes = Array.from({ length: 41 }, (_, i) => (p.window * i) / 40),
    curveSums = curveTimes.map(() => 0);
  const stationary =
    p.history >=
    p.lifetime +
      Math.hypot(p.radius + p.sun, p.thickness / 2) * LIGHT_YEARS_PER_KPC;
  const kernels = curveTimes.map((t) => temporalExposure(0, t, p));
  for (let i = 0; i < p.samples; i++) {
    // Importance sample the reachable cylinder around Earth, then clip to the sphere and galaxy.
    // This resolves small detection volumes that naive galactic sampling would usually miss.
    const rho = rhoMax * Math.sqrt(rng()),
      theta = rng() * 2 * Math.PI,
      z = (2 * rng() - 1) * zMax;
    const r = Math.hypot(p.sun + rho * Math.cos(theta), rho * Math.sin(theta)),
      distance = Math.hypot(rho, z);
    if (horizon > 0 && r <= p.radius && distance <= horizon) {
      const delay = distance * LIGHT_YEARS_PER_KPC;
      const temporal = stationary
        ? kernels[40]
        : temporalExposure(delay, p.window, p);
      for (let j = 0; j < 4; j++) {
        const w = (volumeFactor * density(r, p, SCENARIOS[j].id)) / norms[j];
        const value = (w * temporal * mark) / p.lifetime;
        sums[j] += value;
        squares[j] += value * value;
        mass[j] += w;
        if (j === selected)
          for (let k = 0; k < 41; k++)
            curveSums[k] +=
              (w *
                (stationary
                  ? kernels[k]
                  : temporalExposure(delay, curveTimes[k], p)) *
                mark) /
              p.lifetime;
      }
    }
    if (i % 4000 === 0) progress(i / p.samples);
  }
  const estimates: Estimate[] = SCENARIOS.map((s, j) => ({
    scenario: s.id,
    alpha: sums[j] / p.samples,
    se: Math.sqrt(
      Math.max(0, squares[j] - (sums[j] * sums[j]) / p.samples) /
        (p.samples - 1) /
        p.samples,
    ),
    reachable: mass[j] / p.samples,
    effectiveSamples: squares[j] > 0 ? (sums[j] * sums[j]) / squares[j] : 0,
  }));
  const curve = curveTimes.map((years, k) => ({
    years,
    probability: probability(p.population, curveSums[k] / p.samples),
  }));
  progress(1);
  return {
    parameters: { ...p },
    estimates,
    curve,
    ...generateCatalog(p, horizon),
    horizon,
    fluxThreshold,
    birthRate: p.population / p.lifetime,
    elapsed: performance.now() - start,
  };
}
