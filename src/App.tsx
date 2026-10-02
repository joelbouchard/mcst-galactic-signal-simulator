import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  LoaderCircle,
  Orbit,
  Play,
  Radio,
  RotateCcw,
  Target,
  Telescope,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Controls } from "./components/Controls";
import { ParameterHelpProvider } from "./components/ParameterHelp";
import { GuideHelp } from "./components/GuideHelp";
import { ResultsGuide } from "./components/ResultsGuide";
import { runSimulation } from "./workers/runSimulation";
import { useModelTools } from "./useModelTools";
import Galaxy, { number, status } from "./components/Galaxy";
import { DEFAULTS, SCENARIOS } from "./science/types";
import type {
  Civilization,
  Parameters,
  SimulationResult,
} from "./science/types";
import {
  density,
  detectionPossible,
  LIGHT_YEARS_PER_KPC,
  probability,
  radialNormalization,
  threshold,
  validate,
} from "./science/physics";
const percent = (v: number, d = 1) => `${(100 * v).toFixed(d)}%`;
function save(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export default function App() {
  const [draft, setDraft] = useState<Parameters>({ ...DEFAULTS }),
    [result, setResult] = useState<SimulationResult | null>(null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [errorTitle, setErrorTitle] = useState(""),
    [tab, setTab] = useState("galaxy"),
    [selected, setSelected] = useState<Civilization | null>(null),
    [exported, setExported] = useState(false);
  const cancelRun = useRef<(() => void) | null>(null);
  function run(p: Parameters) {
    const problems = validate(p);
    if (problems.length) {
      setErrorTitle("Check the parameters.");
      setError(problems.join(" "));
      return;
    }
    cancelRun.current?.();
    setBusy(true);
    setProgress(0);
    setError("");
    cancelRun.current = runSimulation(p, {
      onProgress: setProgress,
      onResult: (r) => {
        setResult(r);
        setSelected(
          r.civilizations.find((c) => c.detected) ??
            r.civilizations.find((c) => c.overlap > 0) ??
            r.civilizations[0] ??
            null,
        );
        setBusy(false);
      },
      onError: (message) => {
        setErrorTitle("Simulation unavailable.");
        setError(message);
        setBusy(false);
      },
    });
  }
  useEffect(() => {
    run(DEFAULTS);
    return () => cancelRun.current?.();
  }, []);
  const p = result?.parameters ?? draft,
    estimate = result?.estimates.find((e) => e.scenario === p.scenario),
    alpha = estimate?.alpha ?? 0,
    prob = probability(p.population, alpha),
    dirty = !!result && JSON.stringify(draft) !== JSON.stringify(p),
    low = probability(
      p.population,
      Math.max(0, alpha - 1.96 * (estimate?.se ?? 0)),
    ),
    high = probability(p.population, alpha + 1.96 * (estimate?.se ?? 0));
  useModelTools(result, dirty);
  const exportResults = () => {
    if (!result) return;
    save(
      "mcst-experiment.json",
      JSON.stringify(
        {
          modelVersion: "1.0.0",
          exportedAt: new Date().toISOString(),
          assumptions:
            "Independent Poisson births; fixed lifetimes; matched-band radiometer; random fixed beams; random sky and frequency masks; Poisson visits. See METHODOLOGY.md.",
          ...result,
          estimates: result.estimates.map((e) => ({
            ...e,
            probability: probability(p.population, e.alpha),
            threshold50: threshold(0.5, e.alpha),
            threshold90: threshold(0.9, e.alpha),
            threshold99: threshold(0.99, e.alpha),
          })),
        },
        (_, v) => (v === Infinity ? "unreachable" : v),
        2,
      ),
      "application/json",
    );
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };
  return (
    <ParameterHelpProvider>
      <div className="app-shell">
        <header className="app-header">
          <a
            className="brand"
            href="#"
            aria-label="MCST home"
            onClick={(e) => {
              e.preventDefault();
              setTab("galaxy");
            }}
          >
            <span className="brand-mark">
              <Orbit size={27} />
            </span>
            <strong>MCST</strong>
            <span className="brand-divider" />
            <span>Galactic Signal Observatory</span>
          </a>
          <div className="header-right">
            <span className="version-tag">
              RESEARCH SANDBOX <span>v1.0</span>
            </span>
            <button
              className="icon-button"
              aria-label="Open model documentation"
              onClick={() => setTab("model")}
            >
              <CircleHelp size={19} />
            </button>
          </div>
        </header>
        <div className="workspace">
          <Controls p={draft} onChange={setDraft} />
          <main>
            <div className="page-heading">
              <div>
                <div className="eyebrow">SPATIOTEMPORAL COINCIDENCE MODEL</div>
                <h1>Are we within reach?</h1>
                <p>
                  Explore the conditions for a technological signal to find
                  Earth.
                </p>
              </div>
              <div className="page-actions">
                <div className="export-action">
                  <button
                    className="button secondary"
                    onClick={exportResults}
                    disabled={!result}
                  >
                    {exported ? (
                      <Check size={16} />
                    ) : (
                      <ArrowDownToLine size={16} />
                    )}{" "}
                    {exported ? "Exported" : "Export data"}
                  </button>
                  <GuideHelp topic="exports" />
                </div>
                <button
                  className="button primary"
                  onClick={() => run(draft)}
                  disabled={busy}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <Play size={15} fill="currentColor" />
                  )}
                  {busy
                    ? `Computing ${Math.round(progress * 100)}%`
                    : "Run simulation"}
                </button>
              </div>
            </div>
            {error && (
              <div className="notice error" role="alert">
                <strong>{errorTitle}</strong> {error}
                <button aria-label="Dismiss error" onClick={() => setError("")}>
                  <X size={16} />
                </button>
              </div>
            )}
            {dirty && (
              <div className="notice">
                <span>
                  Parameters changed. Results still show the last completed run.
                </span>
                <button onClick={() => run(draft)} disabled={busy}>
                  Apply changes <ChevronRight size={14} />
                </button>
              </div>
            )}
            {result ? (
              <>
                <div className="metric-row">
                  <div className="metric main-metric">
                    <div className="metric-label">
                      <Radio size={15} /> DETECTION PROBABILITY{" "}
                      <span>{p.window} YR</span>
                      <GuideHelp topic="detection" />
                    </div>
                    <div className="metric-value">
                      {percent(prob)}
                      <span>at least one signal</span>
                    </div>
                    <div className="metric-foot">
                      <span className="tiny-line" />
                      95% numerical interval: {percent(low)}–{percent(high)}
                      <GuideHelp topic="interval" />
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">
                      <Target size={15} /> REQUIRED FOR 90%
                      <GuideHelp topic="thresholds" />
                    </div>
                    <div className="metric-value">
                      {number(threshold(0.9, alpha), 1)}
                      <span>mean emitting civilizations</span>
                    </div>
                    <div className="metric-foot">
                      Given this survey and emission model
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">
                      <Telescope size={15} /> DETECTION HORIZON
                      <GuideHelp topic="horizon" />
                    </div>
                    <div className="metric-value">
                      {number(result.horizon, 2)}
                      <small>kpc</small>
                    </div>
                    <div className="metric-foot">
                      {number(result.horizon * LIGHT_YEARS_PER_KPC)} light-years
                      · on-axis signal
                    </div>
                  </div>
                </div>
                <div className="results-guide-link">
                  <span>Results describe the last completed experiment.</span>
                  <button onClick={() => setTab("model")}>
                    <BookOpen size={15} /> How to read these results
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="content-nav">
                  <div role="tablist" aria-label="Workspace views">
                    <button
                      role="tab"
                      aria-selected={tab === "galaxy"}
                      onClick={() => setTab("galaxy")}
                    >
                      <Orbit size={16} />
                      Galaxy explorer
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === "probability"}
                      onClick={() => setTab("probability")}
                    >
                      <Activity size={16} />
                      Probability analysis
                    </button>
                    <button
                      role="tab"
                      aria-selected={tab === "model"}
                      onClick={() => setTab("model")}
                    >
                      <BookOpen size={16} />
                      Model & assumptions
                    </button>
                  </div>
                  <span className="run-label">
                    Seed {p.seed} <b>·</b> {number(p.samples)} samples
                  </span>
                </div>
                {tab === "galaxy" && (
                  <div className="explorer-grid">
                    <div className="map-column">
                      <Galaxy
                        result={result}
                        selected={selected}
                        onSelect={setSelected}
                      />
                      <div className="insight-strip">
                        <Radio size={22} />
                        <p>
                          <strong>Signals can outlive their senders.</strong> A
                          source {number(p.sun, 1)} kpc away is seen as it was{" "}
                          {number(p.sun * LIGHT_YEARS_PER_KPC)} years ago. Its
                          civilization may already be extinct.
                        </p>
                      </div>
                    </div>
                    <div className="right-column">
                      <Thresholds alpha={alpha} p={p} />
                      <SourceDetails
                        result={result}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    </div>
                  </div>
                )}
                {tab === "probability" && <Analysis result={result} />}
                {tab === "model" && <ModelNotes result={result} />}
                {alpha === 0 && detectionPossible(p) && (
                  <div className="notice">
                    No nonzero detection weights were sampled. Zero probability
                    and infinite thresholds are unresolved numerical estimates.
                    Increase the sample count before interpreting them.
                  </div>
                )}
                {(estimate?.effectiveSamples ?? 0) < 100 && alpha > 0 && (
                  <div className="notice">
                    Low effective sample size (
                    {number(estimate?.effectiveSamples ?? 0)}). Increase spatial
                    samples; the normal-approximation interval may be
                    unreliable.
                  </div>
                )}
                <footer className="workspace-footer">
                  <span>
                    <span className="local-dot" /> Simulation complete ·{" "}
                    {(result.elapsed / 1000).toFixed(2)} s
                  </span>
                  <span>
                    Hypothesis exploration · No empirical estimate of
                    extraterrestrial abundance
                  </span>
                  <button
                    onClick={() => {
                      setDraft({ ...DEFAULTS });
                      run(DEFAULTS);
                    }}
                  >
                    <RotateCcw size={12} /> Reset experiment
                  </button>
                </footer>
              </>
            ) : (
              <div className="initial-loading">
                <Orbit size={42} className={busy ? "spin" : undefined} />
                <h2>
                  {busy
                    ? "Initializing the galactic field"
                    : "Ready to simulate"}
                </h2>
                <p>
                  {busy
                    ? "Integrating signal arrival and survey coverage…"
                    : "Select Run simulation to start or retry the calculation."}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </ParameterHelpProvider>
  );
}
function Thresholds({ alpha, p }: { alpha: number; p: Parameters }) {
  return (
    <section className="threshold-card">
      <div className="eyebrow">INVERTING THE QUESTION</div>
      <h2 className="with-help">
        How many civilizations? <GuideHelp topic="thresholds" />
      </h2>
      <p>
        Mean currently emitting population needed for detection within{" "}
        {p.window} years.
      </p>
      <div className="threshold-list">
        {[0.5, 0.9, 0.99].map((target, i) => (
          <div key={target} className={i === 1 ? "highlight" : ""}>
            <span>
              {percent(target, 0)} <small>chance</small>
            </span>
            <strong>{number(threshold(target, alpha), 1)}</strong>
            <div className="threshold-bar">
              <i style={{ width: `${target * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="equation">
        N<sub>p</sub> = −ln(1 − p) / α
      </div>
      <p className="small-note">
        Birth rate = N / {number(p.lifetime)} yr. With N ={" "}
        {number(p.population)}, expect{" "}
        {number((p.population / p.lifetime) * p.window, 2)} new civilizations
        during the window.
      </p>
    </section>
  );
}
function SourceDetails({
  result,
  selected: c,
  onSelect,
}: {
  result: SimulationResult;
  selected: Civilization | null;
  onSelect: (c: Civilization | null) => void;
}) {
  return (
    <section className="source-card">
      <div className="eyebrow with-help">
        SOURCE INSPECTOR <GuideHelp topic="inspector" />
      </div>
      <div className="source-select">
        <select
          aria-label="Select a civilization"
          value={c?.id ?? ""}
          onChange={(e) =>
            onSelect(
              result.civilizations.find(
                (x) => x.id === Number(e.target.value),
              ) ?? null,
            )
          }
        >
          <option value="">Select a source</option>
          {result.civilizations.map((s) => (
            <option key={s.id} value={s.id}>
              MCST-{String(s.id).padStart(4, "0")}
              {s.detected ? " · Detected" : ""}
            </option>
          ))}
        </select>
      </div>
      {c ? (
        <>
          <div className="with-help source-status">
            <div className={`status-badge ${c.detected ? "detected" : ""}`}>
              {c.detected ? <Check size={12} /> : <Radio size={12} />}{" "}
              {c.detected ? "Detected in window" : status(c) + " now"}
            </div>
            <GuideHelp topic="sourceOutcome" />
          </div>
          <dl className="source-data">
            <div>
              <dt>
                Distance to Earth <GuideHelp topic="distance" />
              </dt>
              <dd>{number(c.distance, 2)} kpc</dd>
            </div>
            <div>
              <dt>
                Light travel time <GuideHelp topic="travel" />
              </dt>
              <dd>{number(c.distance * LIGHT_YEARS_PER_KPC)} yr</dd>
            </div>
            <div>
              <dt>
                Birth relative to now <GuideHelp topic="birth" />
              </dt>
              <dd>{number(c.birth)} yr</dd>
            </div>
            <div>
              <dt>
                Civilization lifetime <GuideHelp topic="civilizationLifetime" />
              </dt>
              <dd>
                {number(
                  result.parameters.lifetime + result.parameters.postLife,
                )}{" "}
                yr
              </dd>
            </div>
            <div>
              <dt>
                Emission duration <GuideHelp topic="emissionDuration" />
              </dt>
              <dd>{number(result.parameters.lifetime)} yr</dd>
            </div>
            <div>
              <dt>
                Arrival begins <GuideHelp topic="arrivalStart" />
              </dt>
              <dd>{number(c.arrivalStart)} yr</dd>
            </div>
            <div>
              <dt>
                Arrival ends <GuideHelp topic="arrivalEnd" />
              </dt>
              <dd>{number(c.arrivalEnd)} yr</dd>
            </div>
            <div>
              <dt>
                Overlap with survey <GuideHelp topic="overlap" />
              </dt>
              <dd>{number(c.overlap, 2)} yr</dd>
            </div>
          </dl>
          <div className="source-reason">{c.reason}</div>
          <p className="small-note">
            Dates are relative to now. Negative values are in the past.
            Detection is one random survey outcome.
          </p>
        </>
      ) : (
        <p className="empty-note">
          Select a point on the map to trace its signal, or choose a source
          above. A population of zero produces an empty catalog.
        </p>
      )}
    </section>
  );
}
function Analysis({ result: r }: { result: SimulationResult }) {
  const p = r.parameters,
    e = r.estimates.find((x) => x.scenario === p.scenario)!,
    scales = SCENARIOS.map((s) => radialNormalization(p, s.id));
  const radial = Array.from({ length: 121 }, (_, i) => {
    const radius = (p.radius * i) / 120;
    return {
      radius,
      ...Object.fromEntries(
        SCENARIOS.map((s, j) => [
          s.id,
          (2 * Math.PI * radius * density(radius, p, s.id)) / scales[j],
        ]),
      ),
    };
  });
  const bound = threshold(0.99, e.alpha),
    maxN = Number.isFinite(bound)
      ? Math.max(p.population, bound * 1.2)
      : Math.max(p.population, 100),
    population = Array.from({ length: 121 }, (_, i) => {
      const n = (maxN * i) / 120;
      return {
        n,
        ...Object.fromEntries(
          r.estimates.map((x) => [x.scenario, 100 * probability(n, x.alpha)]),
        ),
      };
    });
  function csv() {
    const rows = [
      "scenario,mean_emitting_population,window_yr,alpha,alpha_standard_error,probability,n50,n90,n99,expected_births_in_window,seed,samples",
      ...r.estimates.map((x) =>
        [
          x.scenario,
          p.population,
          p.window,
          x.alpha,
          x.se,
          probability(p.population, x.alpha),
          threshold(0.5, x.alpha),
          threshold(0.9, x.alpha),
          threshold(0.99, x.alpha),
          r.birthRate * p.window,
          p.seed,
          p.samples,
        ].join(","),
      ),
    ];
    save("mcst-results.csv", rows.join("\n"), "text/csv");
  }
  return (
    <div className="analysis-view">
      <div className="analysis-grid">
        <section className="chart-card">
          <div className="eyebrow">POPULATION THRESHOLDS</div>
          <h2 className="with-help">
            Probability of at least one detection{" "}
            <GuideHelp topic="populationCurve" />
          </h2>
          <p>
            Chance of at least one detection versus mean emitting population.
          </p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={population}
                margin={{ left: -10, right: 10, top: 12, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="#26313d"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  type="number"
                  domain={[0, maxN]}
                  dataKey="n"
                  tickFormatter={(n) => number(n)}
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => `${number(Number(v))} mean emitters`}
                  formatter={(v, name) => [
                    `${Number(v).toFixed(2)}%`,
                    SCENARIOS.find((s) => s.id === name)?.name ?? name,
                  ]}
                />
                <ReferenceLine y={90} stroke="#93a6b1" strokeDasharray="4 6" />
                {SCENARIOS.map((s) => (
                  <Line
                    isAnimationActive={false}
                    key={s.id}
                    dataKey={s.id}
                    stroke={s.color}
                    strokeWidth={s.id === p.scenario ? 3 : 1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend />
        </section>
        <section className="chart-card">
          <div className="eyebrow">OBSERVATION WINDOW</div>
          <h2 className="with-help">
            What changes with more time? <GuideHelp topic="timeCurve" />
          </h2>
          <p>
            {number(p.population)} mean emitters ·{" "}
            {SCENARIOS.find((s) => s.id === p.scenario)?.name}.
          </p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={r.curve.map((x) => ({
                  ...x,
                  probability: x.probability * 100,
                }))}
                margin={{ left: -10, right: 12, top: 12, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#73e4c0" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#73e4c0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#26313d"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  type="number"
                  domain={[0, p.window]}
                  dataKey="years"
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                  tickFormatter={(v) => `${number(v)} yr`}
                  minTickGap={25}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => `${number(Number(v), 1)} years`}
                  formatter={(v) => [
                    `${Number(v).toFixed(2)}%`,
                    "Detection probability",
                  ]}
                />
                <Area
                  isAnimationActive={false}
                  dataKey="probability"
                  stroke="#73e4c0"
                  strokeWidth={2.5}
                  fill="url(#areaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="small-note">
            Same population and survey cadence; time overlap is integrated for
            each window.
          </p>
        </section>
        <section className="chart-card">
          <div className="eyebrow">NORMALIZED SPATIAL MODEL</div>
          <h2 className="with-help">
            Where civilizations emerge <GuideHelp topic="radialCurve" />
          </h2>
          <p>Radial probability density includes the area factor 2πr.</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={radial}
                margin={{ left: -10, right: 12, top: 12, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="#26313d"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  type="number"
                  domain={[0, p.radius]}
                  dataKey="radius"
                  tickFormatter={(v) => `${number(v)} kpc`}
                  minTickGap={30}
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => Number(v).toFixed(2)}
                  tick={{ fill: "#8c9aab", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) =>
                    `${number(Number(v), 1)} kpc from center`
                  }
                  formatter={(v, name) => [
                    `${Number(v).toFixed(4)} / kpc`,
                    SCENARIOS.find((s) => s.id === name)?.name ?? name,
                  ]}
                />
                <ReferenceLine
                  x={p.sun}
                  stroke="#d4e7e0"
                  label={{ value: "Sun", fill: "#a7b7c3", fontSize: 11 }}
                />
                {SCENARIOS.map((s) => (
                  <Line
                    isAnimationActive={false}
                    key={s.id}
                    dataKey={s.id}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend />
        </section>
        <section className="chart-card numerical-card">
          <div className="eyebrow">NUMERICAL AUDIT</div>
          <h2 className="with-help">
            From emitters to detections <GuideHelp topic="audit" />
          </h2>
          <dl className="source-data">
            <div>
              <dt>
                Birth rate λ <GuideHelp topic="birthRate" />
              </dt>
              <dd>{number(r.birthRate, 5)} / yr</dd>
            </div>
            <div>
              <dt>
                Spatial mass in range <GuideHelp topic="reachable" />
              </dt>
              <dd>{percent(e.reachable, 3)}</dd>
            </div>
            <div>
              <dt>
                Detected sources per mean emitter α <GuideHelp topic="alpha" />
              </dt>
              <dd>{e.alpha.toExponential(4)}</dd>
            </div>
            <div>
              <dt>
                Expected detected sources μ <GuideHelp topic="mu" />
              </dt>
              <dd>{number(p.population * e.alpha, 4)}</dd>
            </div>
            <div>
              <dt>
                Standard error of α <GuideHelp topic="standardError" />
              </dt>
              <dd>{e.se.toExponential(3)}</dd>
            </div>
            <div>
              <dt>
                Effective weighted samples{" "}
                <GuideHelp topic="effectiveSamples" />
              </dt>
              <dd>{number(e.effectiveSamples)}</dd>
            </div>
            <div>
              <dt>
                Integrated flux threshold <GuideHelp topic="flux" />
              </dt>
              <dd>{r.fluxThreshold.toExponential(3)} W/m²</dd>
            </div>
          </dl>
          <p className="small-note">
            The 95% interval estimates numerical sampling error only. It does
            not quantify uncertainty in civilization abundance or the model
            assumptions. Zero estimated weight is not proof of zero physical
            probability.
          </p>
          <div className="equation">P(≥ 1 detection) = 1 − exp(−Nα)</div>
        </section>
      </div>
      <section className="comparison-card">
        <div className="card-heading">
          <div>
            <div className="eyebrow">SCENARIO COMPARISON</div>
            <h2 className="with-help">
              Four hypotheses, one observing program{" "}
              <GuideHelp topic="comparison" />
            </h2>
          </div>
          <button className="button secondary" onClick={csv}>
            <ArrowDownToLine size={15} /> Export CSV
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Spatial scenario</th>
                <th>
                  <span className="with-help">
                    Detection chance <GuideHelp topic="detection" />
                  </span>
                </th>
                <th>
                  <span className="with-help">
                    N for 50% <GuideHelp topic="thresholds" />
                  </span>
                </th>
                <th>
                  <span className="with-help">
                    N for 90% <GuideHelp topic="thresholds" />
                  </span>
                </th>
                <th>
                  <span className="with-help">
                    N for 99% <GuideHelp topic="thresholds" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {r.estimates.map((x) => (
                <tr
                  key={x.scenario}
                  className={x.scenario === p.scenario ? "current" : ""}
                >
                  <td>
                    <i
                      style={{
                        background: SCENARIOS.find((s) => s.id === x.scenario)!
                          .color,
                      }}
                    />
                    {SCENARIOS.find((s) => s.id === x.scenario)!.name}
                  </td>
                  <td>{percent(probability(p.population, x.alpha), 2)}</td>
                  {[0.5, 0.9, 0.99].map((v) => (
                    <td key={v}>{number(threshold(v, x.alpha), 1)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
const tooltipStyle = {
  background: "#151e29",
  border: "1px solid #334351",
  borderRadius: 8,
  color: "#edf3f8",
  fontSize: 12,
};
function ChartLegend() {
  return (
    <div className="chart-legend">
      {SCENARIOS.map((s) => (
        <span key={s.id}>
          <i style={{ background: s.color }} />
          {s.short}
        </span>
      ))}
    </div>
  );
}
function ModelNotes({ result }: { result: SimulationResult }) {
  return (
    <div className="documentation-view">
      <ResultsGuide result={result} />
      <article className="model-notes">
        <div className="model-intro">
          <span className="eyebrow">MCST / MODEL VERSION 1.0</span>
          <h2 className="with-help">
            A signal must cross both space and time. <GuideHelp topic="model" />
          </h2>
          <p>
            This is a conditional forward model and its population inverse. The
            inputs describe hypothetical populations and an idealized radio
            survey. The results do not establish how many extraterrestrial
            civilizations exist.
          </p>
        </div>
        <div className="notes-grid">
          <section>
            <span className="note-number">01</span>
            <h3>Galactic geometry</h3>
            <p>
              Sources occupy a truncated disk with uniform azimuth and uniform
              height in [−H/2, H/2]. Distances use all three coordinates. The
              Sun sits at (R☉, 0, 0). Stars and observers remain fixed during
              the simulation.
            </p>
            <div className="equation">p(r) ∝ 2πr exp(−r/R★) h(r)</div>
            <p>
              A, B, and C are relative per-star propensity hypotheses. The
              uniform reference has constant surface density, so its radial
              density grows as r. Spiral arms are illustrative and do not change
              the sampled source distribution.
            </p>
          </section>
          <section>
            <span className="note-number">02</span>
            <h3>Births, lifetimes & arrival</h3>
            <p>
              Independent births form a constant-rate Poisson process starting
              at −Hbirth and continuing through the future observation window.
              Every source emits from birth for L years, then may survive for an
              additional configurable lifetime. N is the mean in the emission
              phase now, so λ = N/L. Hbirth must be at least L.
            </p>
            <div className="equation">
              [tarrival, tend] = [tbirth + d/c, tbirth + L + d/c]
            </div>
            <p>
              Overlap with [0, T] is necessary for detection. Extinct sources
              remain eligible. With sufficiently long stationary history,
              light-travel delay shifts birth times but does not by itself lower
              the ensemble arrival rate.
            </p>
          </section>
          <section>
            <span className="note-number">03</span>
            <h3>Radio sensitivity & beaming</h3>
            <p>
              EIRP is the on-axis equivalent isotropic power. The ideal receiver
              uses two polarizations and a filter matched to the signal
              bandwidth B. SEFD is in janskys; 1 Jy = 10⁻²⁶ W m⁻² Hz⁻¹.
            </p>
            <div className="equation">
              Fmin = S/N × SEFD × 10⁻²⁶ √(B / (2tint))
              <br />
              dmax = √(EIRP / (4π Fmin))
            </div>
            <p>
              A fixed random beam hits Earth with the configured sky fraction.
              EIRP is held fixed when this fraction changes. A carrier outside
              the receiver band is undetectable; within the band, SEFD is
              assumed constant. Frequency completeness accounts for additional
              unsampled channels. Propagation losses, Doppler drift losses, RFI,
              and false positives are omitted.
            </p>
          </section>
          <section>
            <span className="note-number">04</span>
            <h3>Actual observing opportunities</h3>
            <p>
              Sky and frequency coverage are independent random source-level
              masks. For covered sources, visit start times follow a Poisson
              process. Uptime and transmitter duty independently thin the
              visits. An entire integration must fit inside the arrival interval
              and survey window.
            </p>
            <div className="equation">
              qvisit = 1 − exp[−ν u δ max(0, ℓ − tint)]
            </div>
            <p>
              This assumes the transmitter remains on for a complete successful
              visit. It does not model a deterministic pointing schedule,
              correlated bursts, moving beams, or nonuniform sky selection.
            </p>
          </section>
          <section>
            <span className="note-number">05</span>
            <h3>The inverse calculation</h3>
            <p>
              For each position, the birth-time detection kernel is integrated
              analytically over its piecewise linear overlap function. Spatial
              Monte Carlo integrates that kernel against the normalized
              population density, with beam and survey masks marginalized
              exactly.
            </p>
            <div className="equation">
              α = (fbeam fsky ffreq / L) ∫ ρ(x) I[d ≤ dmax] ∫ qvisit db dx
              <br />μ = Nα · P = 1 − e⁻μ · Np = −ln(1 − p)/α
            </div>
            <p>
              These population thresholds are real-valued ensemble means, not
              guaranteed integer counts. Expected new births in T years equal
              NpT/L; births across the full modeled period equal Np(Hbirth +
              T)/L. The map is an independent illustrative draw, capped at 1,200
              displayed sources.
            </p>
          </section>
          <section>
            <span className="note-number">06</span>
            <h3>Reproducibility & limits</h3>
            <p>
              The seed controls a deterministic random generator. Importance
              sampling uses an Earth-centered cylinder clipped to the
              sensitivity sphere and galactic disk. All four scenarios use the
              same spatial samples for easier comparison. Radial normalization
              uses Simpson quadrature.
            </p>
            <p>
              The reported 95% interval is an approximate normal interval for
              numerical error, transformed to probability. It excludes
              astrophysical model uncertainty. Very low effective sample sizes
              require more samples and independent validation. The uniform
              scenario and limiting-case tests provide analytic checks.
            </p>
            <p>
              Sources:{" "}
              <a
                href="https://arxiv.org/abs/1704.04028"
                target="_blank"
                rel="noreferrer"
              >
                Grimaldi (2017), signal coverage
              </a>
              ;{" "}
              <a
                href="https://arxiv.org/abs/1709.03491"
                target="_blank"
                rel="noreferrer"
              >
                Enriquez et al. (2017), radio SETI sensitivity
              </a>
              . These motivate the framework; the assumptions above specify this
              implementation.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
