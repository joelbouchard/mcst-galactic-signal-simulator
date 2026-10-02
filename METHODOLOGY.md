# MCST v1.0 — Scientific model and numerical method

All times are Julian years relative to now (`t = 0`). Positions are in kiloparsecs. The observation interval is `[0,T]`. Inputs are hypothetical and are not inferred from nondetection data.

## 1. Geometry and normalized population density

The galaxy is a cylinder with radius `R` and full thickness `H_z`. Sources have uniform azimuth and uniform vertical coordinate in `[-H_z/2,H_z/2]`. `H_z = 0` is the thin-disk limit. Earth/Sun is fixed at `(R_sun,0,0)`.

For scenarios A, B, and C, the surface weight is:

```text
w_s(r) = exp(-r / R_star) h_s(r),  0 <= r <= R
h_A(r) = exp(-r / a_A)
h_B(r) = exp(-(r-r_B)^2 / (2 sigma_B^2))
h_C(r) = 1 - exp(-(r/a_C)^2)
```

Defaults are `R=15`, `R_sun=8.2`, `R_star=2.6`, `H_z=0.6`, `a_A=5`, `r_B=8`, `sigma_B=3`, and `a_C=5`, all in kpc. Thus B has the requested denominator `18 kpc²`. The uniform scenario uses `w_U(r)=1`: constant surface density, not constant density per radial increment.

```text
Z_s = integral_0^R 2 pi r w_s(r) dr
p_s(r) = 2 pi r w_s(r) / Z_s
rho_s(x,y,z) = w_s(sqrt(x²+y²)) / (Z_s H_z)
```

`h_s` describes an unmeasured relative propensity per star. It is not an absolute probability. Simpson quadrature with 4,096 radial intervals evaluates `Z_s`. The display catalog uses the inverse CDF of midpoint radial weights at the same resolution. Angular and vertical sampling are uniform. Spiral-arm background particles are decorative and never enter the calculation.

## 2. Birth process and source lifetimes

Births are a Poisson process with constant rate `lambda` from `-H_birth` through `T`. Each birth is independently marked by its spatial location. Each source emits immediately for exactly `L` years and survives a further `L_post` years after emission stops. For a birth at `b`:

```text
emission interval = [b,b+L]
civilization existence = [b,b+L+L_post]
```

The input `N` is the ensemble mean of sources currently in the emission phase, before duty-cycle thinning. Requiring `H_birth >= L` makes the relation `N=lambda L` exact at the present epoch. The mean number actually on at an arbitrary instant is `N delta` under the duty assumption below. There are no births earlier than the configured history. Births continue during the future observation window.

## 3. Light travel and survival of signals

```text
d = sqrt((x-R_sun)^2 + y^2 + z^2)
tau = d/c
arrival interval = [b+tau,b+L+tau]
overlap ell = max(0, min(T,b+L+tau) - max(0,b+tau))
```

The speed of light is exactly `299,792,458 m/s`, the Julian year is `31,557,600 s`, and the kpc conversion is `3.085677581491367e19 m`. One kpc corresponds to approximately `3261.563777` light-years. Positions remain fixed; the model neglects galactic orbits, observer motion, and cosmological effects at these distances.

Emission cessation and extinction do not destroy already propagating photons. With sufficiently old stationary history, `tau` shifts the contributing birth times without reducing the ensemble arrival rate. Finite history breaks that invariance and is explicitly retained in the integral.

For the map at epoch `t`, a spherical emission envelope has outer radius `max(0,t-b)/3261.563777` kpc and inner radius `max(0,t-b-L)/3261.563777` kpc. The map draws its intersection with `z=0`, with projected radius `sqrt(radius²-z_source²)` where real. These are spherical envelopes; beam orientation is represented by an independent hit/miss mark, not by a rendered cone. The Earth-centered detection circle is the maximum footprint in the midplane. Actual eligibility uses 3D distance.

## 4. Idealized radio receiver

Assume an unresolved signal integrated over a filter matched to its bandwidth `B` Hz, two polarizations, and constant SEFD across the accepted band. With integration time `t_int` seconds and signal-to-noise threshold `s`:

```text
F_min = s * SEFD_Jy * 1e-26 * sqrt(B / (2*t_int))   [W/m²]
F(d) = EIRP / (4*pi*(d*KPC_METERS)^2)              [W/m²]
d_max = sqrt(EIRP/(4*pi*F_min)) / KPC_METERS       [kpc]
```

The configured carrier must fall within the receiver band, otherwise `d_max=0`. In-band frequency does not otherwise alter the flux law or SEFD. This idealized treatment assumes the signal bandwidth can be searched with the matched filter; no detailed channelization, band-edge clipping, plasma absorption, scattering, antenna frequency response, polarization mismatch, Doppler drift loss, or RFI penalty is calculated.

EIRP is the **on-axis equivalent isotropic radiated power**, not total transmitter power. The beam occupies fraction `f_beam` of the full sphere, has a fixed random orientation, and intersects Earth with probability `f_beam`. Narrowing the beam while holding EIRP fixed decreases the detection probability without increasing range. A fixed-total-power model would require a separate gain law.

## 5. Survey selection and visit process

Independent source-level selection masks have probabilities `f_sky` and `f_freq`. The sky mask is assumed statistically independent of galactic position: it represents random coverage of sources, not a specific telescope declination mask. Frequency completeness is the fraction of otherwise eligible in-band signals searched.

For selected sources, observing visit start times are Poisson with rate `nu` per year. Visits are independently usable with uptime `u`, and the source remains on for the whole visit with probability `delta`. Thus successful visit-start rate is `r_visit=nu*u*delta`. Source state is assumed independent between visits. This is an effective observing model, not a detailed temporal burst model.

A full integration must lie inside the arrival interval and `[0,T]`. The interval of admissible starts has length `max(0,ell-t_int_years)`, so:

```text
q_visit(ell) = 1 - exp(-nu*u*delta*max(0,ell-t_int_years))
```

Short overlap is not treated as a full-sensitivity visit. A repeated detection of the same source counts only once. The result is probability of detecting at least one distinct source, not a total pulse count.

## 6. Exact birth-time integration and Poisson inverse

For a fixed source position define the effective birth-time exposure:

```text
K(tau,T) = integral_(b=-H_birth)^T q_visit(ell(b,tau,T)) db   [years]
```

Set `a=b+tau`. Intersect its integration bounds with `[-L,T]`. The overlap function is piecewise linear, with changes of slope at `a=0` and `a=T-L`. Each piece is further clipped where `ell <= t_int_years`. Integrate `1-exp(-rate*x)` analytically on each remaining segment. `expm1` and a small-argument series avoid catastrophic cancellation. This is independently tested against fine midpoint integration in both stationary and finite-history cases.

With normalized spatial density `rho`, define:

```text
alpha(T) = f_beam*f_sky*f_freq/L * integral rho(x) I[d<=d_max] K(d/c,T) dx
mu(T) = N*alpha(T)
P(at least one detected source) = 1-exp(-mu(T))
N_p(T) = -ln(1-p)/alpha(T)
```

Poisson marking and thinning justify the exponential count law under the independence assumptions. Population thresholds are real-valued means, not minimum guaranteed numbers or posterior population estimates.

At a threshold `N_p`, the equivalent birth rate is `N_p/L`, the expected number of births during the observation window is `N_p*T/L`, and the expected births throughout the modeled interval `[-H_birth,T]` are `N_p*(H_birth+T)/L`. Under finite history, the expected presently living population is `(N_p/L)*min(H_birth,L+L_post)`. These meanings must not be interchanged.

In the ideal thin-survey-time limit of certain observing, long stationary history, and complete selection, `K -> L+T`. Then `alpha -> F_reachable*(1+T/L)`. In particular, propagation delay alone does not create an extra `L/tau` penalty under stationary births.

## 7. Spatial Monte Carlo and uncertainty

Sample a cylinder centered on Earth with radial extent `rho_max=min(d_max,R+R_sun)` and half-height `z_max=min(d_max,H_z/2)`. Radius is `rho_max*sqrt(U)`, azimuth is uniform, and height is uniform in `[-z_max,z_max]`. Reject points outside either the galactic disk or the detection sphere. The thin-disk case sets `z=0`.

The density-to-proposal weight for accepted points is:

```text
W_s = pi*rho_max² * (2*z_max/H_z) * w_s(r)/Z_s
```

The vertical factor is one for a thin disk. A rejected point has zero weight. This Earth-centered importance sampler resolves small nearby volumes that a naive galactic sampler would almost always miss. It is not self-normalized: the mean of `W_s` estimates reachable probability mass, and the mean of `W_s*K*f_beam*f_sky*f_freq/L` estimates `alpha`. Do not renormalize accepted points, as doing so would discard the small accessible fraction.

All four scenarios share proposal samples. Sample variance divided by sample count gives the estimated variance of `alpha`. The displayed approximate 95% interval transforms `[max(0,alpha-1.96*SE),alpha+1.96*SE]` through the monotone Poisson probability function. It represents numerical error only, omits the small radial-quadrature error, and is not a guaranteed coverage interval for rare or highly concentrated weights. Effective weighted sample size is `(sum v)^2/sum(v²)`. Very small values trigger a warning. A sample with all zero weights cannot certify physical impossibility; the interface distinguishes this from known zero selection or receiver support through an explicit warning.

## 8. Display catalog

The map is independent of the probability estimator. It samples the relevant birth interval covering all arrivals during `[0,T]` and currently living sources, truncated at `-H_birth`. It draws a Poisson source count when the mean is at most 100,000; for larger means it uses the expected count only as a display annotation. It shows at most 1,200 independently sampled sources. A capped map is a representative subsample, not a complete realization of all detections. The independent RNG stream is derived from the input seed.

Each displayed source has explicit birth, emission end, extinction, signal arrival interval, beam mark, sensitivity status, survey marks, and a Bernoulli detection outcome. The source inspector explains its first failed detection condition. The displayed count of green markers must not be used to recover the probability estimate.

## 9. Defaults and interpretation

The default carrier is 1.42 GHz in a 1–2 GHz band; EIRP is `1e15 W`; signal bandwidth is 1 Hz; SEFD is 10 Jy; S/N is 10; integration is 300 s; beam fraction is 1; emission duty is 0.5; sky coverage is 0.2; frequency completeness is 0.5; visit rate is 4 per source-year; uptime is 0.7. These constitute an illustrative hypothetical program, not a calibration of any actual instrument. Especially, the number of visits is per covered source and does not enforce a global telescope-time budget.

The initial 60,000-sample run with seed 42 yields approximately a 1.431-kpc detection horizon, 13.5% detection probability for 100 mean emitters over 50 years, and thresholds of 479, 1,593, and 3,185 for the default ring scenario. They are conditional outputs, not evidence for abundance. Reproduce with the default controls and exported parameter set.

## 10. Contextual references

- Grimaldi, C. (2017), [Signal coverage approach to the detection probability of hypothetical extraterrestrial emitters in the Milky Way](https://arxiv.org/abs/1704.04028), Scientific Reports 7, 46273. Context for finite-duration signal coverage and independent populations.
- Enriquez et al. (2017; revised 2018), [The Breakthrough Listen Search for Intelligent Life: 1.1–1.9 GHz observations of 692 Nearby Stars](https://arxiv.org/abs/1709.03491). Context for radio SETI sensitivity and EIRP. Use the revised version, which notes a correction to an equation.

These papers motivate the physical framing. They do not validate the specific MCST spatial propensity functions, parameter values, or survey simplifications. The equations and tests in this repository define the implemented model.
