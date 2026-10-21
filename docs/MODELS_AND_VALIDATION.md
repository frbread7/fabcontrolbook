# Quantitative models and validation status

All four labs generate synthetic data. The equations below describe the implementation in `assets/js/models.mjs`; they are teaching models, not identified fab processes. Analytical derivations and synthetic values are original work for this reconstruction. External references support only the bounded principles identified in `RECONSTRUCTION_CLAIM_REGISTER.md`.

## A. SPC detection performance

**Model and units.** Time index `t` is a sample number (dimensionless); `z[t]`, shift, and noise scale are in baseline-standard-deviation units. `z[t]=μ[t]+σobs ε[t]`, with independent `ε[t]~N(0,1)`, baseline mean zero, and baseline standard deviation fixed at one. The initial state is `E[0]=C+[0]=C−[0]=0`. For the injected case, the change index is `max(10, floor(horizon/6))`; after it, the mean is a fixed step or rises linearly over 20 samples to the specified shift.

- Shewhart signals on `|z[t]|>3`.
- EWMA is `E[t]=λz[t]+(1−λ)E[t−1]`; its finite-start limit is `3 sqrt(λ/(2−λ)·(1−(1−λ)^(2t)))`.
- Two-sided CUSUM uses `C+[t]=max(0,C+[t−1]+z[t]−0.5)` and `C−[t]=max(0,C−[t−1]−z[t]−0.5)`; signal threshold is 5.

Inputs are bounded to shift `[0,3]`, observed noise scale `[0.25,2]`, `λ [0.05,1]`, horizon `[40,300]` integer samples, trials `[50,1000]`, and positive 32-bit integer seed. The limits remain calibrated to baseline σ=1 even when `σobs≠1`; that deliberate variance mismatch changes signal probability. For each chart the no-shift denominator is all baseline trials, with one-or-more signals over the full horizon. In shifted trials, first alarms are partitioned into pre-change alarms, post-change detections, and no alarm; all three counts use all shifted trials as denominator. Delay is conditional on post-change first alarms. Rates are finite-horizon Monte Carlo proportions, not ARL. Wilson intervals use the usual 95% z=1.96 binomial formula and do not include model uncertainty; conditional median delay has no interval.

**Numerical check on the dated baseline.** Seed 20261014, 300 trials, horizon 120, default λ=0.2 and noise=1 gave full-horizon no-shift alarm counts 92/300 (Shewhart), 67/300 (EWMA), 58/300 (CUSUM), i.e. 0.3067, 0.2233, 0.1933. These unequal operating points cannot support an equal-ARL sensitivity ranking. Current source includes direct recurrence and competing-first-alarm checks in `tests/models.test.mjs`; these are code-level checks, not process validation. **Status: analytical recurrence and deterministic synthetic checks; no process validation.**

## B. FDC signal intelligence

**Model and units.** The trace has 80 indexed samples, four phases of 20 samples, and three normalized channels. Phase centers are declared in `NOMINAL`; each channel is center plus `0.08 ε`, where `ε` is seeded standard normal. Channel values and `σref=0.08` are normalized teaching units. For each phase/channel, observed finite values are used to compute mean `x̄`, sample standard deviation `s`, and OLS slope `β̂` against the original within-phase sample index. Features are `z̄=(x̄−μref)/(σref/√n)`, `zs=(s−σref)/(σref/√(2(n−1)))` (normal-theory approximation), and `zβ=β̂/(σref/√Sxx)` (known-σ iid Gaussian slope standardization). A phase is statistically flagged if any feature's absolute value exceeds the selected threshold. Independent data-integrity flags are any missing channel value or any context/phase mismatch.

For each phase, `missingByChannel[j]` divides missing slots for channel j by its 20 phase rows. `missingRate` instead divides missing channel cells by 60 total phase-channel cells. The dropout example removes six flow samples: flow-channel missingness is 6/20=30%; phase-wide missingness is 6/60=10%. The denominator distinction is intentional. All three feature families across 3 channels and 4 phases yield 36 correlated statistical feature checks per complete trace; thresholding them separately is not a calibrated family-wise rule. A previous 1,000-seed probe at threshold 2.5 produced at least one nominal-trace phase flag in 394/1,000 runs; that is a synthetic experiment-specific frequency, not a field false-call rate.

Valid thresholds are `[0.5,5]`, seeds are positive 32-bit integers, and scenarios are normal, pressure bias, flow ripple, process drift, dropout, and phase skip. Phase index is fixed by sample order. Fewer than two finite points return zero feature scores in code; this guard is not an imputation model. There is no calibrated operating threshold, multiplicity correction, learned classifier, fault identity, equipment data, or field population. **Status: analytically defined synthetic features and explicit channel denominators; no equipment fault validation.**

## C. Run-to-run APC

**Model and units.** `k` indexes runs. `x[k]`, `δ[k]`, `u[k]`, and `y[k]` are normalized output, disturbance, action, and measurement units; plant input gain is fixed at one. The implemented plant and measurement equations are

```text
x[k] = a x[k−1] + (1−a)(δ[k] + u[k−1−d])
y[k] = x[k] + η[k]
```

Here `a` is the first-order memory coefficient and `d` is additional actuation/run delay. State starts at `x[−1]=0`, action history is zero before the first run, EWMA error state is zero, and noise is seeded normal with standard deviation `noise`. A step disturbance begins at `floor(runs·0.3)`. After completing run k, if the requested metrology source exists (`k−m≥0`), the controller consumes `y[k−m]` and updates `e[k]=λ y[k−m]+(1−λ)e[k−1]`, then holds/clips the action as `u[k]=clip(u[k−1]−Kc e[k],−Umax,Umax)`. If the source run is not yet available, EWMA and action are held. The implementation reports that source-run association explicitly. `m` (metrology-result delay) is separate from `d` (actuation/run delay).

Valid ranges: `Kc [0,2]`, `a [0,0.9]`, integer `d,m [0,5]`, `λ [0.05,1]`, noise SD `[0,0.5]`, disturbance `[0,2]`, action limit `[0.2,3]`, positive 32-bit seed, and integer runs `[30,200]`. Saturation is applied to each updated action; the reported saturation fraction counts action samples within `1e−12` of either bound. Output `rmse` is post-disturbance root-mean-square output over the simulated remaining runs; it is a descriptive finite run summary.

**Bounded analytical result.** Only for the unsaturated, noise-free, memoryless special case `a=0`, `d=m=0`, `λ=1`, constant disturbance, unit plant gain, and update-after-measurement timing, `x[k+1]=(1−Kc)x[k]`; asymptotic convergence requires `0<Kc<2` (the general form is `0<Kc Kp<2` for positive static gain `Kp`). This criterion says nothing about first-order memory, EWMA memory, either delay, noise, saturation, changing disturbance, or the full configured range. There is no general stability-region claim. **Status: analytical special case plus deterministic recurrence, source-run hold, and saturation checks; no identified-plant or factory validation.**

## D. Manufacturing alarm strategy

For channel `i` at sample `t`, `zᵢ[t]=sqrt(ρ)c[t]+sqrt(1−ρ)εᵢ[t]+δᵢ[t]`; common and per-channel draws are independent standard normals. This construction has unit marginal variance and same-sample cross-channel correlation `ρ` before injected shifts. It does not add temporal correlation. A channel qualifies when `z>τ`; vote is 1-of-n, strict majority, all-of-n, or valid integer k. The alarm requires the vote on `m` consecutive samples. Initial persistence state is zero; a failed vote resets it. In injected trials channel zero receives a positive shift starting at `floor(horizon/2)`.

Inputs: threshold `[1,4]`, persistence integer `[1,8]`, channels `[1,8]`, `ρ [0,0.8]`, shift `[0.5,4]`, horizon integer `[60,200]`, trials integer `[50,1000]`, and positive 32-bit seed. False-alarm denominator is every no-event trial over the full horizon. Event trials are partitioned by first alarm into pre-event alarm, post-event detection, or no first alarm; each count/rate uses all injected trials as denominator. Pre-event alarms terminate the trial and are competing outcomes, not missed post-event records that can later alarm. Delay mean/median are conditional on post-event first detections. Wilson intervals are finite-trial binomial intervals only.

No alarm shelving, acknowledgement workflow, deadband, inhibit state, resource queues, overlapping episodes, or operator response is represented. **Status: analytically checked synthetic covariance/vote and deterministic outcome partition; no human-factors or fab validation.**

## Shared validity and verification boundary

The model code uses explicit deterministic seeds and bounded inputs and fetches no external data. Numerical checks establish only the stated recurrences and example behavior. Synthetic thresholds, baselines, delay conventions, and normalized units are author-selected model choices unless the claim register explicitly identifies external support. The local precommit verification scope and independent review are recorded in `RECONSTRUCTION_CANDIDATE.md`; exact committed-HEAD evidence belongs in the isolated central quality matrix. Passing tests or source review cannot establish factory suitability.
