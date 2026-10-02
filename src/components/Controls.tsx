import { useId, useState } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Parameters } from "../science/types";
import { DEFAULTS, SCENARIOS } from "../science/types";
import { PARAMETER_HELP, SCENARIO_HELP } from "../science/parameterHelp";
import { ParameterHelp } from "./ParameterHelp";
import { GuideHelp } from "./GuideHelp";
type NumericKey = Exclude<keyof Parameters, "scenario">;
const defaultValue = (key: NumericKey) =>
  DEFAULTS[key] >= 1e7
    ? DEFAULTS[key].toExponential()
    : DEFAULTS[key].toLocaleString("en-US");
interface Props {
  p: Parameters;
  onChange: (p: Parameters) => void;
}
export function Controls({ p, onChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const set = (key: NumericKey, value: number) =>
    onChange({ ...p, [key]: value });
  const field = (
    key: NumericKey,
    label: string,
    min: number,
    max: number,
    step: number,
    unit = "",
    log = false,
  ) => (
    <Field
      key={key}
      parameter={key}
      label={label}
      value={p[key]}
      onChange={(v) => set(key, v)}
      min={min}
      max={max}
      step={step}
      unit={unit}
      log={log}
    />
  );
  return (
    <aside className={`controls ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="panel-title">
        <span>
          <SlidersHorizontal size={17} /> Simulation setup{" "}
          <GuideHelp topic="setup" />
        </span>
        <div className="control-heading-actions">
          <button
            className="mobile-toggle"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? "Hide" : "Edit"} parameters <ChevronDown size={14} />
          </button>
          <button
            className="icon-button"
            title="Restore default parameters"
            aria-label="Restore default parameters"
            onClick={() => onChange({ ...DEFAULTS })}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div className="controls-body">
        <p className="help-intro">
          <span aria-hidden="true">?</span> Hover or tap for definitions and
          examples.
        </p>
        <section className="control-section">
          <div className="section-label with-help">
            01 / POPULATION & TIME <GuideHelp topic="populationSection" />
          </div>
          {field(
            "population",
            "Mean emitting civilizations",
            0,
            1000000,
            1,
            "",
            true,
          )}
          {field("window", "Observation window", 1, 500, 1, "yr")}
          {field("lifetime", "Emission lifetime", 1, 1000000, 1, "yr", true)}
          <More title="Lifecycle assumptions">
            {field(
              "postLife",
              "Lifetime after emission ends",
              0,
              1000000,
              1,
              "yr",
              true,
            )}
            {field(
              "history",
              "Birth history",
              1000,
              1000000000,
              1000,
              "yr",
              true,
            )}
          </More>
        </section>
        <section className="control-section">
          <div className="section-label with-help">
            02 / GALACTIC DISTRIBUTION <GuideHelp topic="distributionSection" />
          </div>
          <div className="field-label scenario-label">
            <span>Spatial scenario</span>
            <ParameterHelp
              content={PARAMETER_HELP.scenario}
              defaultValue="Habitable ring"
            />
          </div>
          <div className="scenario-grid">
            {SCENARIOS.map((s) => (
              <div className="scenario-option" key={s.id}>
                <button
                  onClick={() => onChange({ ...p, scenario: s.id })}
                  className={`scenario-button ${p.scenario === s.id ? "selected" : ""}`}
                  aria-pressed={p.scenario === s.id}
                >
                  <span style={{ color: s.color }}>
                    {s.id === "U" ? "○" : s.id}
                  </span>
                  {s.name}
                </button>
                <ParameterHelp content={SCENARIO_HELP[s.id]} />
              </div>
            ))}
          </div>
          <p className="field-hint">
            Relative civilization propensity per star; these are hypotheses, not
            measured probabilities.
          </p>
          <More title="Galaxy & distribution parameters">
            {field("radius", "Galactic radius", 9, 30, 0.1, "kpc")}
            {field("sun", "Solar radius", 0, 30, 0.1, "kpc")}
            {field("scale", "Stellar density scale", 0.2, 10, 0.1, "kpc")}
            {field("thickness", "Full disk thickness", 0, 3, 0.05, "kpc")}
            {field(
              "centerScale",
              "A · Center decay scale",
              0.2,
              20,
              0.1,
              "kpc",
            )}
            {field("ringRadius", "B · Ring center", 0, 20, 0.1, "kpc")}
            {field(
              "ringWidth",
              "B · Ring standard deviation",
              0.2,
              10,
              0.1,
              "kpc",
            )}
            {field(
              "avoidanceScale",
              "C · Suppression scale",
              0.2,
              20,
              0.1,
              "kpc",
            )}
          </More>
        </section>
        <section className="control-section">
          <div className="section-label with-help">
            03 / TRANSMISSION <GuideHelp topic="transmissionSection" />
          </div>
          {field("eirp", "On-axis EIRP", 0, 1e22, 1, "W", true)}
          {field("beam", "Beam sky fraction", 0, 1, 0.01, "")}
          <More title="Signal properties">
            {field("frequency", "Carrier frequency", 0.1, 100, 0.01, "GHz")}
            {field(
              "bandwidth",
              "Signal bandwidth",
              0.1,
              1000000,
              0.1,
              "Hz",
              true,
            )}
            {field("duty", "Emission duty cycle", 0, 1, 0.01, "", false)}
          </More>
        </section>
        <section className="control-section">
          <div className="section-label with-help">
            04 / EARTH OBSERVATORY <GuideHelp topic="observatorySection" />
          </div>
          {field("sky", "Sky coverage fraction", 0, 1, 0.01)}
          {field("sefd", "Receiver SEFD", 0.1, 10000, 0.1, "Jy", true)}
          <More title="Survey & receiver settings">
            {field(
              "frequencyCoverage",
              "Frequency completeness",
              0,
              1,
              0.01,
              "",
              false,
            )}
            {field("bandMin", "Receiver band minimum", 0, 100, 0.01, "GHz")}
            {field("bandMax", "Receiver band maximum", 0.1, 100, 0.01, "GHz")}
            {field("snr", "Detection S/N threshold", 1, 100, 1)}
            {field(
              "integration",
              "Integration per visit",
              1,
              86400,
              1,
              "s",
              true,
            )}
            {field("visits", "Visits per covered source", 0, 365, 0.1, "/ yr")}
            {field("uptime", "Observatory uptime", 0, 1, 0.01)}
          </More>
        </section>
        <section className="control-section">
          <div className="section-label with-help">
            05 / NUMERICAL PRECISION <GuideHelp topic="precisionSection" />
          </div>
          <div className="field-label samples-label">
            <label className="select-label" htmlFor="samples">
              Spatial samples
            </label>
            <ParameterHelp
              content={PARAMETER_HELP.samples}
              defaultValue={defaultValue("samples")}
              descriptionId="samples-description"
            />
          </div>
          <select
            id="samples"
            aria-describedby="samples-description"
            value={p.samples}
            onChange={(e) => set("samples", Number(e.target.value))}
          >
            <option value={20000}>20,000 · Quick exploration</option>
            <option value={60000}>60,000 · Standard</option>
            <option value={250000}>250,000 · High precision</option>
            <option value={1000000}>1,000,000 · Research</option>
          </select>
          {field("seed", "Random seed", 0, 4294967295, 1, "", false)}
        </section>
      </div>
      <div className="controls-footer">
        <span className="local-dot" /> All calculations run on your device
      </div>
    </aside>
  );
}
function More({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="more">
      <summary>
        {title}
        <ChevronDown size={14} />
      </summary>
      <div>{children}</div>
    </details>
  );
}
function Field({
  parameter,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  log,
}: {
  parameter: NumericKey;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  log: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const floor = Math.max(min, 0.01),
    low = log ? Math.log10(floor) : min,
    high = log ? Math.log10(max) : max;
  const position = log ? Math.log10(Math.max(floor, value)) : value;
  return (
    <div className="field">
      <div className="field-row">
        <div className="field-label">
          <label htmlFor={id}>{label}</label>
          <ParameterHelp
            content={PARAMETER_HELP[parameter]}
            defaultValue={defaultValue(parameter)}
            descriptionId={`${id}-description`}
          />
        </div>
        <div className="number-wrap">
          <input
            id={id}
            aria-describedby={`${id}-description`}
            type="number"
            min={min}
            max={max}
            step="any"
            value={draft ?? (value >= 1e6 ? value.toExponential() : value)}
            onFocus={() =>
              setDraft(value >= 1e6 ? value.toExponential() : String(value))
            }
            onChange={(e) => {
              setDraft(e.target.value);
              if (
                e.target.value !== "" &&
                Number.isFinite(Number(e.target.value))
              )
                onChange(Number(e.target.value));
            }}
            onBlur={() => setDraft(null)}
          />
          {unit && <span>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        aria-describedby={`${id}-description`}
        min={low}
        max={high}
        step={log ? 0.01 : step}
        value={Math.min(high, Math.max(low, position))}
        onChange={(e) => {
          const raw = log
            ? 10 ** Number(e.target.value)
            : Number(e.target.value);
          onChange(log ? Number(raw.toPrecision(3)) : raw);
        }}
        style={
          {
            "--fill": `${(100 * (Math.min(high, Math.max(low, position)) - low)) / (high - low)}%`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
