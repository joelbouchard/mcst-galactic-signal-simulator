export type Scenario = "A" | "B" | "C" | "U";
export interface Parameters {
  scenario: Scenario;
  population: number;
  window: number;
  lifetime: number;
  postLife: number;
  history: number;
  radius: number;
  sun: number;
  scale: number;
  thickness: number;
  centerScale: number;
  ringRadius: number;
  ringWidth: number;
  avoidanceScale: number;
  eirp: number;
  bandwidth: number;
  frequency: number;
  bandMin: number;
  bandMax: number;
  beam: number;
  duty: number;
  sefd: number;
  snr: number;
  integration: number;
  sky: number;
  frequencyCoverage: number;
  visits: number;
  uptime: number;
  samples: number;
  seed: number;
}
export interface Civilization {
  id: number;
  x: number;
  y: number;
  z: number;
  distance: number;
  birth: number;
  emissionEnd: number;
  death: number;
  arrivalStart: number;
  arrivalEnd: number;
  overlap: number;
  inRange: boolean;
  beamHits: boolean;
  detected: boolean;
  reason: string;
}
export interface Estimate {
  scenario: Scenario;
  alpha: number;
  se: number;
  reachable: number;
  effectiveSamples: number;
}
export interface SimulationResult {
  parameters: Parameters;
  estimates: Estimate[];
  curve: { years: number; probability: number }[];
  civilizations: Civilization[];
  catalogPopulation: number;
  horizon: number;
  fluxThreshold: number;
  birthRate: number;
  elapsed: number;
}
export const SCENARIOS: {
  id: Scenario;
  name: string;
  short: string;
  color: string;
  formula: string;
}[] = [
  {
    id: "A",
    name: "Center favored",
    short: "Center",
    color: "#9ea0ff",
    formula: "h(r) = exp(−r / a)",
  },
  {
    id: "B",
    name: "Habitable ring",
    short: "Ring",
    color: "#73e4c0",
    formula: "h(r) = exp(−(r − r₀)² / (2σ²))",
  },
  {
    id: "C",
    name: "Center suppressed",
    short: "Outer disk",
    color: "#efbd78",
    formula: "h(r) = 1 − exp(−(r / a)²)",
  },
  {
    id: "U",
    name: "Uniform reference",
    short: "Uniform",
    color: "#77bafa",
    formula: "Σciv(r) = constant",
  },
];
export const DEFAULTS: Parameters = {
  scenario: "B",
  population: 100,
  window: 50,
  lifetime: 1000,
  postLife: 0,
  history: 1000000,
  radius: 15,
  sun: 8.2,
  scale: 2.6,
  thickness: 0.6,
  centerScale: 5,
  ringRadius: 8,
  ringWidth: 3,
  avoidanceScale: 5,
  eirp: 1e15,
  bandwidth: 1,
  frequency: 1.42,
  bandMin: 1,
  bandMax: 2,
  beam: 1,
  duty: 0.5,
  sefd: 10,
  snr: 10,
  integration: 300,
  sky: 0.2,
  frequencyCoverage: 0.5,
  visits: 4,
  uptime: 0.7,
  samples: 60000,
  seed: 42,
};
