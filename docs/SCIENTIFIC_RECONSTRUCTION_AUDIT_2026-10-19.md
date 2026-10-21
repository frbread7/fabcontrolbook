# Scientific reconstruction baseline — 2026-10-19

This is a read-only scientific audit of the published-source baseline
`49828d6970e50a54cc1d2082d33f28dd6539a2c4`, completed before reconstruction.
It covers all 14 English/Korean chapter pairs, four synthetic experiments, model
code, figures, references, and the existing provenance and validation records.
No test suite was run during this baseline audit. A source review and analytical
checks are not fab, silicon, equipment, or human translation validation.

## Ten-dimension chapter inventory

For each row, the path is exactly `content/{en,ko}/chapters/<file>`. Both editions
use the six `data-section` values `objectives`, `concepts`, `worked-example`,
`limitations`, `review`, and `references`. The assessment order is scientific
correctness / technical depth / conceptual completeness / mathematical
correctness / source evidence / physical consistency / numerical validity /
visual quality / bilingual technical parity / educational usefulness.
`A` means sound for the current compact survey; `G` means an actionable
reconstruction gap; `E` means a concrete error. These are editorial assessments,
not numeric grades or evidence of production suitability.

| Paired chapter file | Ten dimensions | Exact section and improvement plan |
| --- | --- | --- |
| `01-control-architecture.html` | A/G/G/G/G/A/G/G/A/G | `worked-example`: supply sample count, defined chart, numerical decision boundary, and a control-system handoff diagram for the 100/101.1 nm synthetic shift. |
| `02-sensor-lineage.html` | A/G/G/G/G/A/G/G/A/G | `concepts`, `worked-example`: populate a run/measurement join with event and ingestion times, key constraints, and a rejected stale record. |
| `03-measurement-data-integrity.html` | A/G/G/A/G/A/A/G/E/G | `concepts`, `limitations`: preserve the correct variance and duplicated-row example; show effective independent units and correct KO `비모수 꼬리` (“nonparametric tails”) to non-normal tails. |
| `04-spc-rational-subgroups.html` | A/G/G/A/A/A/G/G/A/G | `concepts`, `worked-example`: calculate a chart from a declared Phase I reference and rational subgroup, then separate control from product specification. |
| `05-shewhart-ewma-cusum.html` | A/G/G/A/A/A/A/G/A/G | `concepts`, `worked-example`: plot a short worked sequence, derive the EWMA variance and CUSUM recurrence, and compare finite-horizon false alarms at stated calibration. |
| `06-fdc-trace-segmentation.html` | A/G/G/A/G/A/G/G/A/G | `worked-example`, `references`: state time weighting and gap handling for the 117/120 coverage example; cite phase-alignment/FDC evidence that directly supports the claim. |
| `07-fdc-multivariate-false-alarms.html` | A/G/G/A/G/A/G/G/A/G | `worked-example`, `references`: supply a vector, covariance, calculated T², threshold and confusion counts; replace the short NIST software note as sole mathematical support. |
| `08-chamber-matching-tool-health.html` | A/G/G/G/G/A/G/G/A/G | `worked-example`: calculate a paired difference interval for the stated 12 matched lots and predeclared ±0.5 nm equivalence margin; make pairing and clustering explicit. |
| `09-run-to-run-apc.html` | E/G/G/E/G/E/E/G/E/G | `concepts`, `worked-example`: correct the claimed monotone response, add a run-by-run state table and stability condition, and separate metrology-result delay from actuation delay in the linked lab. |
| `10-feedforward-feedback-delays.html` | E/G/G/E/A/A/A/G/E/G | `concepts`: write EN Laplace variables as Y(s), U(s), D(s), matching the KO domain; add an event-time/arrival-time delay example. |
| `11-constraints-excursions-safe-response.html` | A/G/G/A/A/A/A/G/A/G | `worked-example`: retain the correct 50.6/50.7 nm control-versus-spec distinction; add a bounded move/feasibility calculation and independent equipment-safe boundary. |
| `12-alarm-management-disposition.html` | A/G/G/A/A/A/A/G/E/G | `worked-example`, `review`: calculate alarm burden and missed-event cases; align KO deadband versus hysteresis terms with the actual EN mechanism. |
| `13-synthetic-fab-case-studies.html` | A/G/G/A/A/A/A/G/A/G | `worked-example`: give synthetic per-run rows, uncertainty and one discriminating test for the sensor-bias/process-state hypotheses; keep the 102.27 nm arithmetic and conditional causality. |
| `14-verification-change-governance.html` | A/G/G/A/A/A/A/G/A/G | `worked-example`: turn the correct 2 units/s slope calculation into a populated requirement-to-test/evidence/decision matrix. |

All 14 pairs have matching section structure and reference URLs. Targeted
semantic checks found the three KO issues above; structural parity alone does
not establish line-by-line scientific equivalence. Chapter source has no
scientific table or figure. The single control-hierarchy SVG is on both landing
pages with English labels; the four lab graphics are synthetic. A graduate
engineering reconstruction needs actual derivations, data, and decision
artifacts rather than more prose alone.

## Experiment and model register

All four experiments are declared in `content/labs.json`, presented at
`content/{en,ko}/lab.html` and implemented in `assets/js/models.mjs`.
`docs/MODELS_AND_VALIDATION.md` states their current equations and bounds.

| Experiment and anchor | Independent check of current model | Limit and action |
| --- | --- | --- |
| SPC detection `#spc-performance` | Shewhart, finite-start EWMA variance, and two-sided CUSUM recurrences agree with their stated iid Gaussian model. The 95% Wilson intervals describe finite-trial proportions. With UI seed 20261014, 300 trials, and 120 points, full-horizon no-shift alarm proportions are 0.3067, 0.2233, 0.1933 respectively. | Different in-control alarm rates prevent an equal-ARL sensitivity ranking. Display the denominator and calibration difference beside the results; distinguish finite-horizon probability from ARL. |
| FDC signal intelligence `#fdc-intelligence` | Mean z, approximate sample-SD z, and OLS slope z follow the declared known-σ iid baseline. In a read-only 1000-seed probe at threshold 2.5, 394 nominal trials flagged at least one phase. | Thirty-six correlated feature checks inflate run-level flags. Report nominal burden and per-channel coverage: the six missing flow points are 30% of that channel’s 20 steady-phase samples, although the current phase-wide metric is 10%. No flag is a fault identity. |
| Run-to-run APC `#r2r-control` | The implemented plant is `x[k]=a x[k−1]+(1−a)(d[k]+u[k−1−d])`; measurement is immediate `y[k]=x[k]+η[k]`; the EWMA of measured error updates clipped `u[k]`. Positive gain gives the correcting sign. At allowed `Kc=2, λ=1, a=d=0`, zero noise and a positive step yield alternating ±1 output: bounded input is not asymptotic stability. | The UI’s `d` is extra actuation/run delay, while Chapter 09 asks for metrology delay. Give these separate state variables and run association, derive the zero-delay stability case, and show saturation/hold behavior without claiming a universal stable region. |
| Alarm strategy `#alarm-strategy` | The common-factor construction has unit marginal variance and pairwise correlation ρ. k-of-n voting, persistence, finite-horizon proportions, and Wilson intervals match their definitions. | An alarm before the event ends a trial and is counted neither as a valid post-event detection nor as conditional sensitivity. Expose this competing outcome and denominators; distinguish cross-channel ρ from temporal correlation, which is absent. |

For Chapter 09’s stated no-delay, noise-free scalar example, define
`q[k]=−y[k]`, `qbar[k]=0.5 q[k]+0.5 qbar[k−1]`, and
`u[k+1]=u[k]+0.5 qbar[k]`, with `y[k]=2u[k]+1` after the step and zero
initial state. The successive outputs are `1, 0.5, 0, −0.25, −0.25`.
Thus the manuscript’s assertion that every update reduces error is false.
This is a direct recurrence calculation, not a process measurement.

## Ranked error register and evidence boundary

| Priority | Evidence and confidence | Required disposition |
| --- | --- | --- |
| **P1** | Chapter 09 `worked-example` says error decreases successively in EN and KO; the explicit recurrence overshoots. High confidence, direct calculation. | Correct both worked examples and show the actual trajectory and oscillation/settling trade. |
| **P1** | Chapter 09 requests one-run metrology delay, while `assets/js/models.mjs` applies `u[k−1−d]` and measures each run immediately. High confidence, source-to-code comparison. | Align chapter/lab physical timing, with separate metrology and actuation delay semantics. |
| **P2** | Chapter 10 EN `concepts` writes `y(t)=G(s)u(t)+Gd(s)d(t)` “in the Laplace domain”; KO uses s-domain notation. High confidence. | Correct EN equation and paired explanation; verify units and transform convention. |
| **P2** | KO Chapter 03 `limitations` and Chapter 12 `review` change technical meaning. High confidence for the exact terms; full KO semantic parity beyond targeted checks remains unknown. | Correct matched passages and rereview the affected pair. |
| **P2** | Nominal FDC flag frequency, unequal SPC calibration, conditional alarm detection and missingness denominator can mislead when presented without their monitoring-unit definitions. High confidence for current code/output; no field false-alarm inference. | Make denominators and calibration visible and add bounded synthetic checks. |
| **P2** | Several worked examples omit the actual data/derivation they promise; chapter source has no scientific figure/table. High confidence for inventory, editorial inference for severity. | Complete the high-value examples and original visuals described above. |
| **P3** | English-only landing SVG labels and missing lab axis/legend detail reduce bilingual/accessibility quality. High confidence for presence, lower release impact. | Localize or pair labels and improve text alternatives during the figure pass. |

No P0 defect was established. The bibliography cites public NIST statistics
handbook sections and peer-reviewed R2R work, but a linked general source is not
automatic support for a nearby claim. Cite individual equations and design
conditions precisely in the reconstruction. No copyrighted figures, data, or
standards text should be copied; existing CC BY 4.0/MIT component scope remains
the working rights boundary. The audit did not check full text of every linked
publication, nor did it identify a qualified factory population or validate a
controller against equipment. Existing historical test/review claims were not
treated as fresh scientific proof.
