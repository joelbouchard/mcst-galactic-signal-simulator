import type { Parameters, Scenario } from "./types";
export const KPC_METERS = 3.085677581491367e19;
export const YEAR_SECONDS = 31557600;
export const LIGHT_YEARS_PER_KPC = KPC_METERS / (299792458 * YEAR_SECONDS);
export function density(
  r: number,
  p: Parameters,
  scenario: Scenario = p.scenario,
) {
  if (r > p.radius) return 0;
  if (scenario === "U") return 1;
  const h =
    scenario === "A"
      ? Math.exp(-r / p.centerScale)
      : scenario === "B"
        ? Math.exp(-((r - p.ringRadius) ** 2) / (2 * p.ringWidth ** 2))
        : -Math.expm1(-((r / p.avoidanceScale) ** 2));
  return Math.exp(-r / p.scale) * h;
}
export function radialNormalization(
  p: Parameters,
  scenario: Scenario = p.scenario,
) {
  // Simpson integration of the surface density, including the radial Jacobian.
  const n = 4096,
    dr = p.radius / n;
  let sum = 0;
  for (let i = 0; i <= n; i++)
    sum +=
      (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) *
      (i * dr) *
      density(i * dr, p, scenario);
  return (2 * Math.PI * dr * sum) / 3;
}
export function receiver(p: Parameters) {
  // Matched bandwidth, two polarizations, ideal radiometer threshold; EIRP is on-axis.
  const fluxThreshold =
    p.snr * p.sefd * 1e-26 * Math.sqrt(p.bandwidth / (2 * p.integration));
  const inBand = p.frequency >= p.bandMin && p.frequency <= p.bandMax;
  return {
    fluxThreshold,
    horizon: inBand
      ? Math.sqrt(p.eirp / (4 * Math.PI * fluxThreshold)) / KPC_METERS
      : 0,
  };
}
export function overlap(start: number, end: number, window: number) {
  return Math.max(0, Math.min(end, window) - Math.max(start, 0));
}
export function visitProbability(duration: number, p: Parameters) {
  return -Math.expm1(
    -p.visits *
      p.uptime *
      p.duty *
      Math.max(0, duration - p.integration / YEAR_SECONDS),
  );
}
// Integrate 1-exp(-rate*x) for a linear exposure x over an interval, stably near zero.
function linearIntegral(x0: number, x1: number, width: number, rate: number) {
  if (width <= 0 || rate === 0) return 0;
  const a = rate * Math.min(x0, x1),
    delta = rate * Math.abs(x1 - x0);
  const phi =
    delta < 1e-5
      ? 1 - delta / 2 + (delta * delta) / 6 - delta ** 3 / 24
      : -Math.expm1(-delta) / delta;
  return width * (-Math.expm1(-a) + Math.exp(-a) * (1 - phi));
}
export function temporalExposure(delay: number, window: number, p: Parameters) {
  // Arrival start a=b+delay. Births exist on [-history, window].
  const lo = Math.max(-p.lifetime, -p.history + delay),
    hi = Math.min(window, window + delay);
  const tint = p.integration / YEAR_SECONDS;
  if (hi <= lo || window <= tint || p.lifetime <= tint) return 0;
  const cuts = [lo, hi, 0, window - p.lifetime]
    .filter((x) => x >= lo && x <= hi)
    .sort((a, b) => a - b);
  let integral = 0;
  for (let i = 1; i < cuts.length; i++) {
    let a = cuts[i - 1],
      b = cuts[i];
    let u = overlap(a, a + p.lifetime, window) - tint,
      v = overlap(b, b + p.lifetime, window) - tint;
    if (u <= 0 && v <= 0) continue;
    if (u < 0) {
      a += ((b - a) * -u) / (v - u);
      u = 0;
    } else if (v < 0) {
      b = a + ((b - a) * u) / (u - v);
      v = 0;
    }
    integral += linearIntegral(u, v, b - a, p.visits * p.uptime * p.duty);
  }
  return integral;
}
export function probability(population: number, alpha: number) {
  return -Math.expm1(-Math.max(0, population * alpha));
}
export function threshold(target: number, alpha: number) {
  return alpha > 0 ? -Math.log1p(-target) / alpha : Infinity;
}
export function detectionPossible(p: Parameters) {
  return (
    receiver(p).horizon > 0 &&
    p.beam * p.sky * p.frequencyCoverage * p.visits * p.uptime * p.duty > 0 &&
    Math.min(p.lifetime, p.window) > p.integration / YEAR_SECONDS
  );
}
export function validate(p: Parameters): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(p))
    if (
      key !== "scenario" &&
      (typeof value !== "number" || !Number.isFinite(value))
    )
      errors.push(`${key} must be a finite number.`);
  for (const key of [
    "window",
    "lifetime",
    "history",
    "radius",
    "scale",
    "centerScale",
    "ringWidth",
    "avoidanceScale",
    "bandwidth",
    "sefd",
    "snr",
    "integration",
    "frequency",
    "samples",
  ] as const)
    if (p[key] <= 0) errors.push(`${key} must be positive.`);
  for (const key of [
    "beam",
    "duty",
    "sky",
    "frequencyCoverage",
    "uptime",
  ] as const)
    if (p[key] < 0 || p[key] > 1)
      errors.push(`${key} must be between 0 and 1.`);
  for (const key of [
    "population",
    "postLife",
    "thickness",
    "sun",
    "ringRadius",
    "eirp",
    "bandMin",
    "visits",
  ] as const)
    if (p[key] < 0) errors.push(`${key} cannot be negative.`);
  if (p.history < p.lifetime)
    errors.push(
      "Birth history must be at least as long as the emission lifetime.",
    );
  if (p.sun > p.radius)
    errors.push("The Sun must be inside the galactic disk.");
  if (p.ringRadius > p.radius)
    errors.push("The habitable-ring center must be inside the galactic disk.");
  if (p.bandMax <= p.bandMin)
    errors.push("The receiver band maximum must exceed its minimum.");
  if (!["A", "B", "C", "U"].includes(p.scenario))
    errors.push("Unknown spatial scenario.");
  if (!Number.isInteger(p.samples) || p.samples < 1000 || p.samples > 1000000)
    errors.push("Use 1,000 to 1,000,000 spatial samples.");
  if (!Number.isInteger(p.seed) || p.seed < 0 || p.seed > 4294967295)
    errors.push("Seed must be an integer from 0 to 4,294,967,295.");
  // Supported numerical domain also prevents canvas overflow and degenerate quadrature.
  const bounds: Partial<Record<keyof Parameters, [number, number]>> = {
    population: [0, 1e9],
    window: [0.001, 1e6],
    lifetime: [1, 1e6],
    postLife: [0, 1e9],
    history: [1, 1e9],
    radius: [1, 100],
    sun: [0, 100],
    scale: [0.2, 20],
    thickness: [0, 10],
    centerScale: [0.2, 30],
    ringRadius: [0, 30],
    ringWidth: [0.2, 20],
    avoidanceScale: [0.2, 30],
    eirp: [0, 1e30],
    bandwidth: [0.01, 1e9],
    frequency: [0.01, 1000],
    bandMin: [0, 1000],
    bandMax: [0.01, 1000],
    sefd: [0.01, 1e6],
    snr: [1, 1000],
    integration: [0.001, 31557600],
    visits: [0, 1e6],
  };
  for (const [key, range] of Object.entries(bounds)) {
    const value = p[key as keyof Parameters] as number;
    if (value < range[0] || value > range[1])
      errors.push(`${key} must be between ${range[0]} and ${range[1]}.`);
  }
  return errors;
}
