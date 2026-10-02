# Reading MCST results

MCST computes what an idealized Earth survey could detect **if the supplied assumptions were true**. It does not estimate whether extraterrestrial life exists or infer the actual number of civilizations from observations.

The application includes this reading guide in **Model & assumptions**, accessible through **How to read these results**. Its worked example uses the last completed run. The **?** icons beside sections, outputs, charts and source details provide definitions, units, examples and limitations. Hover to preview; click or tap to pin; close with Escape, the close button or a click outside. Only one help card is open at a time.

## Read the headline results

| Output                 | Interpretation                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detection probability  | Chance of at least one distinct source being detected during the entire observation window, conditional on the completed run's assumptions.                           |
| 95% numerical interval | Approximate Monte Carlo integration-error interval. It excludes uncertainty in the physical assumptions or actual extraterrestrial abundance.                         |
| Required for 90%       | Mean currently emitting population needed to give a 90% chance, with all other assumptions fixed. A 10% chance of no detection remains.                               |
| Detection horizon      | Maximum distance allowed by ideal on-axis signal sensitivity and receiver-band eligibility. Timing, alignment, coverage and visits are additional conditions.         |
| N for 50%, 90%, 99%    | Inverse population thresholds, expressed as real-valued means. They are not guaranteed integer populations, total historical births or empirical abundance estimates. |

For mean current emitters `N`, emission lifetime `L`, survey duration `T` and integrated survey coefficient `alpha`:

```text
birth rate lambda = N / L
expected new births during the survey = N T / L
expected distinct detected sources mu = N alpha
probability of at least one detection P = 1 - exp(-mu)
mean population for target probability p: Np = -ln(1-p) / alpha
```

`mu` counts distinct detected sources, not messages or observing visits. A fractional expectation is normal. For example, `mu = 1` implies `P ≈ 63.2%`, not certainty. `alpha` is a coefficient per unit of mean current population; it can exceed one when a long survey encounters successive generations of emitters.

With the default assumptions (ring scenario, `N = 100`, `L = 1,000 yr`, `T = 50 yr`, seed 42 and 60,000 spatial samples), the result is about **13.5%**, with thresholds around **479 / 1,593 / 3,185** for **50% / 90% / 99%**. About 135 of 1,000 hypothetical repetitions would have at least one detection, on average. These numbers describe a hypothetical transmitter and observing program, not a forecast. Detection does not establish two-way contact.

## Read the charts

- **Probability versus population:** horizontal axis = mean currently emitting population; vertical axis = chance of at least one detection. Each line holds the other completed-run settings fixed for one spatial scenario. The dashed line is 90%.
- **Probability versus observing time:** horizontal axis = years searched starting now; vertical axis = cumulative chance by that time. Population and visit rate stay fixed. It is not a probability per year.
- **Radial probability density:** horizontal axis = radius from the galactic center, not Earth; vertical axis = density per kpc. The probability in an annulus is the area under the curve over that radial interval. Each curve integrates to one and includes the `2πr` area factor.
- **Scenario comparison:** all four hypotheses use the same population and observing program. A smaller required population means easier detection under that hypothesis. The rows are not probabilities that each hypothesis is true. Shared spatial samples make numerical errors across scenarios correlated.

## Read the numerical audit

| Symbol or output           | Meaning and unit                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Birth rate λ               | Expected new technological civilizations per year, `N/L`. Births are random rather than regularly scheduled.                                                                                |
| Spatial mass in range      | Estimated fraction of the normalized civilization distribution within the 3D sensitivity horizon. It excludes the other detection conditions. It is not simply a fraction of galactic area. |
| α                          | Integrated expected detected sources per unit of mean current emitting population. It combines spatial distribution, birth-time overlap, sensitivity, beaming and observing opportunities.  |
| μ                          | Mean distinct detected-source count in the full hypothetical galaxy, `Nα`.                                                                                                                  |
| Standard error of α        | Estimated sampling standard error of the spatial Monte Carlo mean, in the same units as α.                                                                                                  |
| Effective weighted samples | `(sum w)^2 / sum(w^2)` for detection-contribution weights. A concentration diagnostic, not a count of civilizations. The UI flags values below 100 when α is nonzero.                       |
| Integrated flux threshold  | Minimum received signal flux across its bandwidth, in W/m². This is not spectral flux density in W/m²/Hz. A lower threshold implies greater sensitivity.                                    |

The probability interval transforms `max(0, alpha - 1.96 SE)` and `alpha + 1.96 SE` through the probability formula. The normal approximation may be poor for rare or strongly concentrated contributions. Increasing the sample count usually improves integration precision; it does not validate the physical assumptions. Changing the seed explores numerical variation and changes the illustrative catalog.

## Read the map and source inspector

The map is a separate random realization capped at 1,200 displayed sources. Counting visible green points does **not** estimate the headline probability. The catalog can include past, current and future sources from signal-relevant birth history; it is not a snapshot containing exactly `N` emitters.

Distances use all three coordinates even though the display is face-on. The detection circle is the midplane cross-section of an Earth-centered sensitivity sphere. Spiral arms are illustrative. Selected signal fronts are intersections of spherical propagation envelopes with the midplane; beam alignment is checked separately.

Purple denotes emitting sources; gray denotes extinct sources. Amber represents post-emission sources or signal arrival at Earth. Green denotes detection during the full survey window. The map epoch slider changes lifecycle colors and propagation geometry; it does not change the completed-run probabilities, full-window detection status, or inspector dates. Inspector lifecycle badges refer to now.

| Inspector field       | Interpretation                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Distance to Earth     | Straight-line 3D distance to the Sun, in kpc; 1 kpc is approximately 3,262 light-years.                                                    |
| Light travel time     | `d/c`, in years; not the waiting time from today.                                                                                          |
| Birth relative to now | Source birth and start of emission. Negative dates are past; positive dates are future.                                                    |
| Civilization lifetime | Emission lifetime plus survival after emission ends.                                                                                       |
| Emission duration     | Length of the emission phase, before duty-cycle effects; shared by all sources.                                                            |
| Arrival begins        | `birth + d/c`, relative to now.                                                                                                            |
| Arrival ends          | `birth + L + d/c`, relative to now.                                                                                                        |
| Overlap with survey   | Intersection length between the arrival interval and `[0,T]`. A complete integration must fit within this overlap.                         |
| Detection outcome     | One random source outcome. A failure explanation gives the first failed condition in the checking order, not necessarily the only failure. |

A source born at `-5,000 yr`, emitting for `1,000 yr`, with a `4,500 yr` light travel time has an arrival interval from `-500` to `+500 yr`. Its civilization may be extinct while its signal is still crossing Earth. Temporal overlap alone does not guarantee detection.

## Interpret zero and unreachable values

- **Displayed 0.0% or 100.0%:** may be rounded. Do not infer exact impossibility or certainty from the formatted percentage alone.
- **N = 0:** no sources are assumed, so detection chance is zero. Thresholds can still be finite if α is positive.
- **Detection disabled by inputs:** zero power, out-of-band carrier, zero beam/coverage/visits/uptime/duty, or inadequate time for an integration can force a zero yield. Increasing N does not fix such a condition.
- **Zero sampled contribution:** if detection is not disabled, α = 0 can leave the estimate unresolved. Increase samples and inspect the spatial and temporal support. A zero sample is not evidence that extraterrestrial life is absent.
- **Unreachable:** the inverse threshold has no finite value in the calculation because estimated α is zero. Distinguish a disabled model from an unresolved numerical estimate before interpreting it.

## Read an export

Exports contain the **last completed experiment**. Pending parameter edits are not included. JSON contains inputs, model version, all scenario estimates, diagnostics, the time curve and the illustrative catalog. CSV contains the four scenario estimates, population thresholds, expected new births, seed and sample count.

Probabilities in JSON and CSV are fractions (`0.135` means `13.5%`). The UI displays percentages. Non-finite thresholds serialize as `"unreachable"` in JSON and `Infinity` in CSV. Save the inputs and seed with any result you cite. See [METHODOLOGY.md](METHODOLOGY.md) for the equations and assumptions.
