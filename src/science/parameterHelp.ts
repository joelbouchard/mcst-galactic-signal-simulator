import type { Parameters, Scenario } from "./types";

export interface HelpContent {
  kind?: "section" | "result";
  title: string;
  unit: string;
  meaning: string;
  effect: string;
  example: string;
  note?: string;
}

/** Describes the implemented model; exhaustive typing keeps new parameters from going undocumented. */
export const PARAMETER_HELP: Record<keyof Parameters, HelpContent> = {
  population: {
    title: "Mean emitting civilizations",
    unit: "Mean population",
    meaning:
      "The average number of civilizations in their technological emission phase across the whole galaxy right now. The realized number fluctuates between hypothetical galaxies.",
    effect:
      "More emitters increase the chance of at least one detection. This input comes before the emission duty cycle, beam direction, and survey coverage are applied.",
    example:
      "100 emitters with a 1,000-year emission lifetime imply 0.1 new civilizations per year: one every 10 years on average.",
    note: "This is an assumed ensemble mean, not an observed count or the number of dots on the map.",
  },
  window: {
    title: "Observation window",
    unit: "Years from now",
    meaning:
      "How long Earth searches for signals, starting now. Signal arrival must overlap this interval long enough for a complete observing visit.",
    effect:
      "A longer window gives more opportunities to detect signals, with diminishing returns for sources already likely to be detected.",
    example:
      "50 yr searches the interval from now to 50 years in the future. A civilization may have disappeared long before its signal arrives.",
  },
  lifetime: {
    title: "Emission lifetime",
    unit: "Years per civilization",
    meaning:
      "The length of each civilization's technological emission phase. In this model, emission begins at civilization birth; intermittent activity is handled separately by the duty cycle.",
    effect:
      "At a fixed mean emitting population, a longer lifetime lowers the birth rate: λ = N / L. It creates longer-lived signals but fewer new emitters, so the detection benefit is not automatically positive.",
    example:
      "Keeping N = 100, increasing L from 1,000 to 10,000 yr lowers births from 0.1 to 0.01 per year.",
    note: "Birth history must be at least this long. All civilizations share this lifetime in the current model.",
  },
  postLife: {
    title: "Lifetime after emission ends",
    unit: "Years",
    meaning:
      "How long a civilization survives after it permanently stops transmitting. Its total modeled lifetime is emission lifetime plus this additional time.",
    effect:
      "Changes whether a displayed source is classified as extinct or post-emission. It does not change detection probabilities: photons already emitted continue traveling.",
    example:
      "1,000 yr of emission plus 9,000 yr afterward gives a total civilization lifetime of 10,000 yr.",
  },
  history: {
    title: "Birth history",
    unit: "Years before now",
    meaning:
      "How far into the past the constant civilization birth process extends. No civilizations are born before that starting point; births continue through the future observation window.",
    effect:
      "A short history can remove distant signals that would need an older sender. Once history is long enough to include the relevant travel times and emission lifetimes, increasing it has no further effect on detection probability.",
    example:
      "A source 10 kpc away has a travel delay of about 32,616 years. A 1,000-year birth history cannot yet supply its signal to a 50-year survey.",
    note: "Must be at least the emission lifetime. This is the age of the modeled birth process, not the age of the Milky Way.",
  },
  scenario: {
    title: "Spatial scenario",
    unit: "Distribution hypothesis",
    meaning:
      "Chooses where civilizations are more likely to emerge. A, B, and C multiply the declining stellar density by a relative propensity per star. Uniform uses constant surface density.",
    effect:
      "Changes the fraction of civilizations close enough to Earth to be detected. The main result and map follow the selected scenario; Probability analysis compares all four.",
    example:
      "Habitable ring favors emergence per star near 8 kpc from the center. That does not mean every source lies in that ring.",
    note: "These are adjustable hypotheses, not measured habitability probabilities. All radial distributions include the area factor 2πr.",
  },
  radius: {
    title: "Galactic radius",
    unit: "kpc · 1 kpc ≈ 3,262 light-years",
    meaning:
      "The outer edge of the modeled galactic disk, measured from the galactic center. Civilizations are placed inside this boundary.",
    effect:
      "Redistributes the same mean population over a differently sized galaxy, changing distances and the fraction within detection range.",
    example:
      "15 kpc gives a disk 30 kpc across, approximately 97,847 light-years in diameter.",
    note: "Both the solar radius and habitable-ring center must be inside the disk.",
  },
  sun: {
    title: "Solar radius",
    unit: "kpc from the galactic center",
    meaning:
      "The Sun's distance from the center of the galaxy. Earth is treated as being at the same location, in the disk's midplane.",
    effect:
      "Moves the observer relative to the source distribution. Whether detection improves depends on the selected spatial scenario.",
    example:
      "8.2 kpc places Earth about 26,745 light-years from the galactic center.",
    note: "This means the Sun's galactic position, not the physical radius of the Sun.",
  },
  scale: {
    title: "Stellar density scale",
    unit: "kpc",
    meaning:
      "The radial scale R★ in the stellar surface density exp(−r / R★). Density falls to about 37% whenever radius increases by one scale length.",
    effect:
      "A larger scale spreads stars, and thus potential civilizations, farther from the center in scenarios A, B, and C. The uniform reference does not use this parameter.",
    example:
      "At a scale of 2.6 kpc, stellar surface density at 5.2 kpc is exp(−2), about 13.5% of its central value.",
  },
  thickness: {
    title: "Full disk thickness",
    unit: "kpc, top to bottom",
    meaning:
      "The total vertical extent of the disk. Source heights are uniform between minus half this value and plus half this value.",
    effect:
      "A thicker disk puts more sources away from Earth's midplane. Actual distances use all three coordinates, even though the map is viewed from above.",
    example:
      "0.6 kpc gives heights from −0.3 to +0.3 kpc. Set 0 for an exactly two-dimensional disk.",
  },
  centerScale: {
    title: "A · Center decay scale",
    unit: "kpc · scenario A",
    meaning:
      "The scale a in the center-favored propensity hA(r) = exp(−r / a). This is multiplied by the stellar density.",
    effect:
      "A smaller value concentrates emergence more strongly toward the center; a larger value weakens that extra central preference.",
    example:
      "With a = 5 kpc, the relative propensity per star at 5 kpc is about 37% of its value at the center.",
    note: "Affects scenario A and its comparison curve; it does not change the main result when another scenario is selected.",
  },
  ringRadius: {
    title: "B · Ring center",
    unit: "kpc · scenario B",
    meaning:
      "The radius r₀ where the ring's relative emergence propensity per star peaks.",
    effect:
      "Moves the favored region inward or outward. Its relationship to Earth's position affects how many sources fall within detection range.",
    example:
      "r₀ = 8 kpc puts the propensity peak close to the default solar radius of 8.2 kpc.",
    note: "The peak of the actual radial source distribution can differ from r₀ because stellar density and the 2πr area factor also contribute. Must lie inside the galaxy.",
  },
  ringWidth: {
    title: "B · Ring standard deviation",
    unit: "kpc · scenario B",
    meaning:
      "The Gaussian width σ in hB(r) = exp(−(r − r₀)² / (2σ²)). It controls how broadly the ring favors emergence per star.",
    effect:
      "A larger width makes the favored region broader; a smaller width concentrates the preference near the ring center.",
    example:
      "With σ = 3 kpc, propensity 3 kpc from the ring center is about 61% of its peak; at 6 kpc away it is about 14%.",
    note: "This is the width of the propensity function, not the standard deviation of the final sampled population.",
  },
  avoidanceScale: {
    title: "C · Suppression scale",
    unit: "kpc · scenario C",
    meaning:
      "The scale a in the center-suppressed propensity hC(r) = 1 − exp(−(r / a)²). Propensity rises from zero at the galactic center.",
    effect:
      "A larger scale extends the central suppression farther outward. The remaining population still follows declining stellar density.",
    example:
      "At r = a, propensity is about 63% of its large-radius limit. With a = 5 kpc, this occurs at 5 kpc.",
    note: "Affects scenario C and its comparison curve only.",
  },
  eirp: {
    title: "On-axis EIRP",
    unit: "W · watts",
    meaning:
      "Equivalent isotropic radiated power in the direction of the beam: the power an all-direction transmitter would need to produce the same received flux.",
    effect:
      "Higher EIRP increases detection range. With the receiver unchanged, range scales as the square root of EIRP.",
    example:
      "1e15 means 10¹⁵ W. Multiplying EIRP by 4 doubles the detection horizon.",
    note: "This is not necessarily the transmitter's actual total power. Changing beam fraction does not automatically change EIRP.",
  },
  beam: {
    title: "Beam sky fraction",
    unit: "Fraction · 0 to 1",
    meaning:
      "The fraction of all directions illuminated by a fixed, randomly oriented transmitter beam. It is also the probability that this beam points toward Earth.",
    effect:
      "A smaller fraction reduces how many signals intersect Earth. Detection range stays unchanged because on-axis EIRP is specified separately.",
    example:
      "1 is all-direction emission. 0.01 illuminates 1% of the full sky and gives a 1% chance of alignment with Earth.",
    note: "No scanning, moving beam, or deliberate targeting of Earth is modeled.",
  },
  frequency: {
    title: "Carrier frequency",
    unit: "GHz · billions of cycles per second",
    meaning:
      "The central radio frequency emitted by every modeled civilization. It must lie between the receiver's minimum and maximum frequencies.",
    effect:
      "A carrier outside the receiver band gives zero detection probability. Within the band, changing this frequency alone does not change sensitivity in the current model.",
    example: "1.42 GHz is eligible for a 1–2 GHz receiver; 3 GHz is not.",
    note: "Receiver sensitivity is assumed constant within the band. Frequency completeness is a separate selection factor.",
  },
  bandwidth: {
    title: "Signal bandwidth",
    unit: "Hz · hertz",
    meaning:
      "The frequency width occupied by the transmitted signal. The receiver is assumed to use a filter matched to this width.",
    effect:
      "At fixed total EIRP, a wider signal is harder to detect. Range scales as bandwidth to the power −1/4.",
    example:
      "Increasing bandwidth from 1 Hz to 16 Hz halves the detection horizon with all other receiver settings fixed.",
    note: "This describes signal width, not the full range of frequencies the telescope can observe.",
  },
  duty: {
    title: "Emission duty cycle",
    unit: "Fraction · 0 to 1",
    meaning:
      "The probability that a transmitter stays on for a complete observing visit during its emission lifetime.",
    effect:
      "A higher duty cycle increases successful observing opportunities. It does not change the nominal emission lifetime or instantaneous on-state EIRP.",
    example:
      "0.5 means the transmitter is on for a usable visit with 50% probability; 1 means it is always on during its emission phase.",
    note: "States are independent between visits. Detailed bursts and correlated on/off cycles are not simulated.",
  },
  sky: {
    title: "Sky coverage fraction",
    unit: "Fraction · 0 to 1",
    meaning:
      "The fraction of potential source locations included in the survey, represented as a random selection independent of galactic position.",
    effect:
      "Increasing coverage includes more potential senders. Halving it halves the expected detected-source count, but does not generally halve the probability of at least one detection.",
    example:
      "0.2 means each source has a 20% chance of belonging to the searched region.",
    note: "This is not the fraction of time spent observing and does not reproduce a specific telescope pointing mask.",
  },
  sefd: {
    title: "Receiver SEFD",
    unit: "Jy · janskys",
    meaning:
      "System equivalent flux density: a measure of receiver noise relative to its collecting ability. A lower value means a more sensitive receiver.",
    effect:
      "Lower SEFD lets the same signal be detected farther away. Range scales as 1 / √SEFD when other settings are fixed.",
    example:
      "Reducing SEFD from 10 Jy to 2.5 Jy doubles the detection horizon.",
    note: "1 Jy = 10⁻²⁶ W m⁻² Hz⁻¹. The default describes an idealized receiver, not a calibrated telescope survey.",
  },
  frequencyCoverage: {
    title: "Frequency completeness",
    unit: "Fraction · 0 to 1",
    meaning:
      "The fraction of otherwise in-band source signals actually searched. This represents incomplete frequency sampling after the carrier has passed the receiver-band check.",
    effect:
      "A larger value includes more signals. It multiplies source eligibility independently of sky coverage and beam alignment.",
    example:
      "0.5 means half of eligible in-band sources pass this additional selection, even if all have a carrier within the nominal receiver band.",
    note: "This is an effective completeness assumption, not a detailed schedule of which radio channels are observed.",
  },
  bandMin: {
    title: "Receiver band minimum",
    unit: "GHz",
    meaning:
      "The lowest carrier frequency accepted by the receiver. The band includes this boundary.",
    effect:
      "Raising this value above the configured carrier excludes every modeled signal. Lowering it has no additional benefit when the carrier is already inside the band.",
    example:
      "With a 1.42 GHz carrier and a 2 GHz upper limit, a minimum of 1 GHz admits the signal; 1.5 GHz excludes it.",
    note: "Must be below the receiver band maximum. Detailed clipping of the signal's bandwidth at a band edge is not modeled.",
  },
  bandMax: {
    title: "Receiver band maximum",
    unit: "GHz",
    meaning:
      "The highest carrier frequency accepted by the receiver. The band includes this boundary.",
    effect:
      "Lowering this value below the configured carrier excludes every modeled signal. Widening a band that already contains the carrier does not automatically improve completeness.",
    example:
      "For a 1.42 GHz carrier, an upper limit of 2 GHz admits it; an upper limit of 1.4 GHz excludes it.",
    note: "Must exceed the receiver band minimum. Frequency completeness controls additional in-band sampling separately.",
  },
  snr: {
    title: "Detection S/N threshold",
    unit: "Signal-to-noise ratio",
    meaning:
      "The minimum signal-to-noise ratio required to count a signal as detectable in a usable observing visit.",
    effect:
      "A higher threshold is stricter and reduces detection range. Range scales as 1 / √(S/N threshold).",
    example:
      "Raising the threshold from 10 to 40 halves the detection horizon.",
    note: "This model applies a sensitivity cutoff; it does not calculate false alarms or radio-frequency interference.",
  },
  integration: {
    title: "Integration per visit",
    unit: "Seconds per visit",
    meaning:
      "How long the receiver collects a signal during one visit. The full integration must fit within both the arrival interval and the observation window.",
    effect:
      "Longer integration improves sensitivity, with range proportional to time to the power 1/4. However, brief signal overlaps may no longer fit a complete visit.",
    example:
      "300 s is 5 minutes. Increasing integration to 4,800 s doubles the sensitivity-based horizon, provided a full visit can fit.",
    note: "Visits per year remain a separate input; the model does not enforce a total telescope-time budget.",
  },
  visits: {
    title: "Visits per covered source",
    unit: "Mean visits per year, per source",
    meaning:
      "The average annual rate of observing visits to each covered source. Visit times are random rather than regularly spaced.",
    effect:
      "More visits improve the chance of catching an arriving signal. Uptime and emission duty cycle reduce the rate of successful visits.",
    example:
      "4 visits/yr × 0.7 uptime × 0.5 duty gives 1.4 successful visit opportunities per source-year of usable overlap.",
    note: "This rate applies to each covered source, not to the entire observing program. Setting 0 prevents detections.",
  },
  uptime: {
    title: "Observatory uptime",
    unit: "Fraction · 0 to 1",
    meaning:
      "The probability that a planned observing visit is usable, representing instrument availability, weather, or other observing losses.",
    effect:
      "A higher value increases the effective visit rate. It changes observing opportunities, not the instantaneous sensitivity or detection horizon.",
    example:
      "0.7 keeps 70% of planned visits on average. It combines with, but is distinct from, the transmitter's duty cycle.",
  },
  samples: {
    title: "Spatial samples",
    unit: "Monte Carlo sample points",
    meaning:
      "The number of random spatial points used to estimate detection probabilities. The same points support comparisons between all four spatial scenarios.",
    effect:
      "More samples generally reduce numerical noise and take longer to calculate. They do not increase the physical population or the number of displayed sources.",
    example:
      "Multiplying samples by 4 usually halves the Monte Carlo standard error. The displayed map remains capped at 1,200 sources.",
    note: "The 95% numerical interval measures sampling error, not uncertainty about alien abundance or the scientific assumptions.",
  },
  seed: {
    title: "Random seed",
    unit: "Integer · 0 to 4,294,967,295",
    meaning:
      "The starting value of the deterministic random generator. It controls spatial sampling and the independent illustrative source catalog.",
    effect:
      "The same seed and parameter set reproduce the same numerical results and source catalog. Changing only the seed explores sampling variation, not a different physical hypothesis.",
    example:
      "Use 42 to reproduce the default experiment, or try 43 to compare another random draw.",
    note: "A seed is a reproducibility setting; larger seeds do not mean better precision.",
  },
};

export const SCENARIO_HELP: Record<Scenario, HelpContent> = {
  A: {
    title: "A · Center favored",
    unit: "Spatial hypothesis",
    meaning:
      "Stars near the galactic center are given an additional relative preference for producing civilizations: hA(r) = exp(−r / a).",
    effect:
      "Combines this preference with the already declining stellar density. Adjust Center decay scale to change the strength of the preference.",
    example:
      "At the default a = 5 kpc, propensity per star at 10 kpc is about 13.5% of its central value.",
    note: "A relative, unmeasured propensity. The final radial distribution also includes the 2πr area factor.",
  },
  B: {
    title: "B · Habitable ring",
    unit: "Spatial hypothesis",
    meaning:
      "Emergence per star is favored near a configurable galactocentric radius: hB(r) = exp(−(r − r₀)² / (2σ²)).",
    effect:
      "Ring center moves the favored region; ring standard deviation controls its width. Declining stellar density and the radial area factor also shape the final population.",
    example:
      "The default r₀ = 8 kpc and σ = 3 kpc reproduce the requested denominator of 18 kpc².",
    note: "A hypothetical emergence preference, not evidence for a measured habitable zone.",
  },
  C: {
    title: "C · Center suppressed",
    unit: "Spatial hypothesis",
    meaning:
      "Emergence is suppressed near the center: hC(r) = 1 − exp(−(r / a)²). Farther away, the propensity approaches one.",
    effect:
      "Moves relative population weight away from the center while retaining declining stellar density. Suppression scale controls how far that penalty extends.",
    example:
      "With a = 5 kpc, propensity reaches about 63% at 5 kpc and 98% at 10 kpc.",
    note: "The outer galaxy is not necessarily most populated: the stellar density still declines outward.",
  },
  U: {
    title: "Uniform reference",
    unit: "Constant surface density",
    meaning:
      "Every equal-area patch of the galactic disk has equal expected civilization density. This reference does not use the stellar exponential or propensity functions.",
    effect:
      "Provides a geometric comparison with A, B, and C. The selected total population is distributed over the same disk and vertical thickness.",
    example:
      "The outer half of the disk's radius contains 75% of its area, so it holds 75% of the expected sources in this scenario.",
    note: "Uniform in area does not mean uniform in radius: radial sampling still includes 2πr.",
  },
};
