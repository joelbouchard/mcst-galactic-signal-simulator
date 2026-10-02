# MCST — Galactic Signal Observatory

A local, English-language research simulator for **spatiotemporal coincidence of technological civilizations**. Configure a hypothetical galactic population and radio survey, inspect delayed signals on a 3D-aware face-on map, and invert the model for 50%, 90%, and 99% detection probabilities.

## Run locally

Requires Node.js **22.12+** (tested with Node 24.14.1) and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**. The development server binds to your computer's loopback interface. No account, API key, or simulation service is required. Dependency installation needs internet access; the installed application computes locally and uses no external fonts or assets.

```sh
npm test           # Scientific benchmark and limiting-case tests
npm run build      # TypeScript checks and production bundle
npm run preview    # Serve the production build locally
```

## Use

### If a calculation worker cannot start

The local server must remain running while using the development app. A page that is already open may stay visible after the server stops, but a new calculation can fail because its worker script cannot be loaded. Start `npm run dev`, leave that terminal running, and reload the page. The app displays actionable guidance if the browser supplies no error details, and stops the loading indicator so the calculation can be retried. Existing completed results are retained.

### Explore the simulation

1. Set population, observation window, distribution, transmitter, and survey parameters. Expand the settings sections for detailed assumptions. On narrow screens, select **Edit parameters**.
   Every parameter and spatial scenario has a **?** button. Hover for a quick explanation, or click/tap to keep it open. Each guide includes units, the default value where applicable, its effect on the results, a concrete example, and important model assumptions. The buttons also work with the keyboard; close with **Escape**, the close button, or a click outside the card.
2. Select **Run simulation**. Until a new run completes, the displayed results retain the preceding run's parameters and show a pending-changes notice.
3. Pan and zoom the map, select a civilization, and move the map epoch from now through the observation window. The source selector also supports keyboard interaction.
4. Open **Probability analysis** for population curves, time curves, normalized radial distributions, scenario comparisons, and the numerical audit.
5. Use **Export data** for the parameter set, model version, estimates, uncertainty, time curve, and sampled source catalog in JSON. **Export CSV** in Probability analysis exports the four scenario results. Impossible thresholds are `"unreachable"` in JSON and `Infinity` in CSV. A zero Monte Carlo estimate with nonzero physical support is explicitly flagged as unresolved in the interface.

## Scientific interpretation

Read [RESULTS_GUIDE.md](RESULTS_GUIDE.md) for definitions and worked interpretations of the outputs, and [METHODOLOGY.md](METHODOLOGY.md) before treating any output as research evidence. **How to read these results** opens the in-app guide in **Model & assumptions**, including an interpretation of the last completed run. Sections, metrics, source fields and charts have contextual **?** help alongside the parameter guides.

- Births form an independent Poisson process with rate `lambda = N / L`. `N` is the mean population currently in its emission phase, before intermittent duty-cycle thinning. It is not a fixed realized count.
- The model includes finite signal travel time, finite birth history, a distinct post-emission survival interval, 3D distance, radio sensitivity, fixed random beams, carrier band eligibility, coverage masks, and random survey visits.
- Source emission begins at civilization birth. Lifetimes, EIRP, and bandwidth are constant across sources. These are explicit starting assumptions because the supplied specification stopped at the Population section.
- The confidence interval reports **numerical Monte Carlo error**, not uncertainty about real extraterrestrial life.
- The source catalog is a separate illustrative population realization, capped at 1,200 displayed sources. Its displayed detections are not the Monte Carlo estimate. Spiral arms are a visual guide; they do not drive the spatial sampling.

Default inputs deliberately describe a hypothetical survey and powerful transmitter, not a forecast or a named observatory. With 100 mean emitters, a 1,000-year emission lifetime, the habitable-ring distribution, and a 50-year window, the seeded result is approximately **13.5%**. The corresponding mean-population thresholds are approximately **479 / 1,593 / 3,185** for **50% / 90% / 99%**. Changing the assumptions changes these values substantially.

## Architecture

```text
src/science/physics.ts           Units, density, receiver, time integration, inverse
src/science/random.ts            Seeded RNG and bounded display population sampler
src/science/simulation.ts        Spatial Monte Carlo, scenario estimates, source catalog
src/science/science.test.ts      Independent physical and analytic benchmarks
src/workers/simulation.worker.ts Calculation worker, progress, errors
src/components/Controls.tsx     Parameter editing and responsive control panel
src/components/Galaxy.tsx       Canvas geometry, selection, pan, zoom, wavefronts
src/App.tsx                     Results, charts, exports, model notes
src/styles.css                  Responsive observatory interface
```

React + TypeScript + Vite, Recharts, Canvas 2D, and a dedicated Web Worker. The seed and complete inputs determine results; computation time is intentionally nondeterministic. No original `MCST_v1_methodologie.md`, `mcst_v1.py`, or `mcst_v1_results.csv` was present in the initial workspace.

## Verification

The scientific suite checks unit conversion, radiometer scaling, finite time overlap against independent numerical integration, stationary limits, extinct-sender arrival, exact spatial normalization, a uniform thin-disk benchmark, a small 3D sphere benchmark, inverse probabilities, reproducibility, coverage scaling, monotonic observation windows, and zero-detection limits. The production build also checks TypeScript.

This implementation has not been externally peer reviewed. Spatial nonstationarity, galactic motion, correlated births, variable source properties, structured pointing schedules, Doppler/RFI losses, and empirical astrophysical priors require extensions before application to a specific survey.
