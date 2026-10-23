# FabControlBook v1.1.0 candidate preparation

This candidate covers the scientific reconstruction documented in [`RECONSTRUCTION_CANDIDATE.md`](RECONSTRUCTION_CANDIDATE.md): all 14 English/Korean chapter pairs and four interactive synthetic-data labs, with corresponding model, site, and browser-journey changes.

## Scope

- Worked examples clarify assumptions, units, sampling, denominator choices, and evidence boundaries across SPC, FDC, run-to-run control, and alarm response.
- SPC and alarm labs partition pre-event alarms, post-event detections, and no-signal outcomes using all eligible trials as denominators. Their rates are finite-horizon Monte Carlo proportions, not average run length (ARL). FDC examples distinguish per-channel from phase-wide missingness; 36 correlated feature checks are not a calibrated family-wise rule.
- Alarm burden uses a separate denominator from event detection: the example counts 18 annunciations across 10 staffed hours, with 3,600 one-second samples per hour; event outcomes use 12 separate challenge trials.
- The run-to-run control model states the plant recurrence `x[k]=a x[k−1]+(1−a)(δ[k]+u[k−1−d])` and measurement `y[k]=x[k]+η[k]`. It distinguishes metrology-result delay `m` from actuation/run delay `d`, identifies the consumed source run, and holds state/action when metrology is unavailable. The `0 < KcKp < 2` convergence condition applies only to the stated unsaturated, noise-free, memoryless special case; it is not a general stability claim. The worked example shows one oscillatory but damped recurrence without implying plant-wide stability.

## Limits and status at preparation

Examples and lab outputs use synthetic, author-selected inputs and assumptions. They are not calibrated to an identified production tool or process population and establish no fab, equipment, or silicon validation. Internal review and deterministic checks do not establish external professional certification, human translation certification, legal approval, or production suitability.

At candidate preparation on 2026-10-23, source release metadata was aligned to v1.1.0 and the repository manifest remained `in-progress`. This records candidate preparation only; it makes no claim that release gates passed, a release was created, or deployment occurred. My Library remains the authority for current publication status and deployed version. The scope and evidence record are in [`RECONSTRUCTION_CANDIDATE.md`](RECONSTRUCTION_CANDIDATE.md), [`MODELS_AND_VALIDATION.md`](MODELS_AND_VALIDATION.md), and [`SCIENTIFIC_RECONSTRUCTION_AUDIT_2026-10-19.md`](SCIENTIFIC_RECONSTRUCTION_AUDIT_2026-10-19.md).
