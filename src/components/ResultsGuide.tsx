import type { SimulationResult } from "../science/types";
import { SCENARIOS } from "../science/types";
import { detectionPossible, probability, threshold } from "../science/physics";
import { GUIDE_HELP } from "../science/guideHelp";
import type { GuideTopic } from "../science/guideHelp";
import { number } from "./Galaxy";
import { GuideHelp } from "./GuideHelp";

const glossary: GuideTopic[] = [
  "birthRate",
  "reachable",
  "alpha",
  "mu",
  "standardError",
  "effectiveSamples",
  "flux",
];

export function ResultsGuide({ result: r }: { result: SimulationResult }) {
  const p = r.parameters;
  const e = r.estimates.find((estimate) => estimate.scenario === p.scenario)!;
  const chance = probability(p.population, e.alpha);
  const n90 = threshold(0.9, e.alpha);
  const scenario = SCENARIOS.find((s) => s.id === p.scenario)!.name;
  return (
    <article className="results-guide" aria-labelledby="results-guide-title">
      <div className="guide-intro">
        <span className="eyebrow">READING YOUR EXPERIMENT</span>
        <h2 id="results-guide-title">What do these results mean?</h2>
        <p>
          MCST asks what Earth could detect{" "}
          <strong>if your assumptions were true</strong>. It does not measure
          the actual abundance of extraterrestrial civilizations. Use the ?
          buttons beside sections and results for definitions, examples and
          limits.
        </p>
      </div>

      <section
        className="guide-current"
        aria-labelledby="current-interpretation"
      >
        <div className="eyebrow">YOUR LAST COMPLETED RUN · {scenario}</div>
        <h3 id="current-interpretation">
          {(100 * chance).toFixed(1)}% chance over {number(p.window)} years
        </h3>
        <p>
          With{" "}
          <strong>{number(p.population)} mean emitting civilizations</strong>,
          the model gives approximately{" "}
          <strong>
            {number(p.population * e.alpha, 4)} expected detected sources
          </strong>{" "}
          in the full hypothetical galaxy. Across 1,000 hypothetical repetitions
          with these assumptions, about {number(1000 * chance)} would contain at
          least one detection, on average.
        </p>
        {Number.isFinite(n90) && (
          <p>
            Keeping the spatial, emission and survey settings fixed, a mean
            population of about <strong>{number(n90, 1)}</strong> would give a
            90% chance of at least one detection. Even at this threshold, 10% of
            repetitions would contain no detection.
          </p>
        )}
        {e.alpha === 0 && (
          <p className="guide-caution">
            {detectionPossible(p)
              ? "No nonzero detection contribution was sampled. The zero estimate and Unreachable thresholds remain numerically unresolved; increase samples and examine the model's temporal and spatial support."
              : "These inputs disable detection (for example through band eligibility, zero power or coverage, or insufficient time for an integration). Increasing population alone cannot restore it."}
          </p>
        )}
        {p.population === 0 && e.alpha > 0 && (
          <p>
            No emitters were assumed, so the detection chance is zero. The
            population thresholds still describe what a nonzero population would
            require.
          </p>
        )}
        <p className="guide-caption">
          This reading updates after Run simulation. Pending parameter edits do
          not change it.
        </p>
      </section>

      <div className="reading-grid">
        <section>
          <span className="note-number">01 / CHANCE</span>
          <h3 className="with-help">
            A probability, not a forecast <GuideHelp topic="detection" />
          </h3>
          <p>{GUIDE_HELP.detection.meaning}</p>
          <p>
            A 50% chance leaves an equal chance of no detection. It does not
            mean half the civilizations are detectable. Detecting a signal also
            does not imply a conversation or a reply.
          </p>
        </section>
        <section>
          <span className="note-number">02 / POPULATION</span>
          <h3 className="with-help">
            The number needed <GuideHelp topic="thresholds" />
          </h3>
          <p>{GUIDE_HELP.thresholds.meaning}</p>
          <p>
            These are currently emitting ensemble means, not total civilizations
            ever born. Decimal values are meaningful. Their corresponding birth
            rate is Np/L; expected new births during the window equal NpT/L.
          </p>
        </section>
        <section>
          <span className="note-number">03 / SENSITIVITY</span>
          <h3 className="with-help">
            Range is one condition <GuideHelp topic="horizon" />
          </h3>
          <p>{GUIDE_HELP.horizon.meaning}</p>
          <p>
            A source within range must still point toward Earth, overlap the
            observing window, fall within coverage and receive a successful
            observing visit. One kpc is about 3,262 light-years.
          </p>
        </section>
        <section>
          <span className="note-number">04 / PRECISION</span>
          <h3 className="with-help">
            What the 95% interval covers <GuideHelp topic="interval" />
          </h3>
          <p>{GUIDE_HELP.interval.effect}</p>
          <p>
            Small intervals show precise integration of a chosen hypothesis.
            They are not confidence bounds on real extraterrestrial abundance.
            Low effective sample counts make the approximation less reliable.
          </p>
        </section>
        <section>
          <span className="note-number">05 / MAP & SOURCES</span>
          <h3 className="with-help">
            An illustrative realization <GuideHelp topic="galaxy" />
          </h3>
          <p>
            The map draws a separate random catalog capped at 1,200 sources. Its
            visible detections are not used to compute the headline probability.
          </p>
          <p>
            Source dates use now = 0: negative means past, positive means
            future. Arrival dates add d/c to emission dates. An extinct
            civilization's signal can still arrive today. Moving Map epoch
            changes the view, not the completed survey results.
          </p>
        </section>
        <section>
          <span className="note-number">06 / CHARTS & COMPARISONS</span>
          <h3 className="with-help">
            Compare one assumption at a time <GuideHelp topic="comparison" />
          </h3>
          <p>
            The population chart varies N; the time chart varies the survey
            duration. The radial chart shows density per kpc from the galactic
            center, with total area one for each scenario.
          </p>
          <p>
            In the comparison table, a smaller population threshold means easier
            detection under that spatial hypothesis. It does not make that
            hypothesis more likely to be true.
          </p>
        </section>
      </div>

      <section
        className="guide-glossary"
        aria-labelledby="audit-glossary-title"
      >
        <h3 id="audit-glossary-title" className="with-help">
          Numerical audit glossary <GuideHelp topic="audit" />
        </h3>
        <div className="equation">
          λ = N / L → μ = Nα → P(≥ 1) = 1 − exp(−μ)
        </div>
        <dl>
          {glossary.map((topic) => (
            <div key={topic}>
              <dt className="with-help">
                {GUIDE_HELP[topic].title} <GuideHelp topic={topic} />
              </dt>
              <dd>
                {GUIDE_HELP[topic].meaning}{" "}
                <span>{GUIDE_HELP[topic].unit}.</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="guide-caption">
          μ is a mean count of distinct sources, not a probability: μ = 1 gives
          P ≈ 63.2%. α can exceed one when a long survey samples successive
          generations of emitters.
        </p>
      </section>

      <section className="guide-limits" aria-labelledby="zero-results-title">
        <h3 id="zero-results-title">Zero, 100% and “Unreachable”</h3>
        <p>
          A displayed 0.0% or 100.0% can result from rounding. “Unreachable”
          appears when the estimated α is zero. Check for a disabled detection
          condition, such as a carrier outside the receiver band, zero coverage
          or no usable visits. If no such condition applies, zero sampled
          contributions leave the estimate unresolved.
        </p>
        <p>
          Increase spatial samples and examine the warnings and assumptions
          before drawing a conclusion. More samples reduce numerical error; they
          do not validate a physical hypothesis.
        </p>
      </section>
      <section className="guide-exports">
        <h3 className="with-help">
          Reading an export <GuideHelp topic="exports" />
        </h3>
        <p>
          JSON preserves the completed experiment and catalog. CSV compares the
          four scenarios. Exported probabilities are fractions: 0.135 means
          13.5%. Non-finite thresholds are written as “unreachable” in JSON and
          Infinity in CSV. Save the full inputs and seed alongside every result
          you compare.
        </p>
      </section>
    </article>
  );
}
