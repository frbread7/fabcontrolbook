# Scientific reconstruction candidate — 2026-10-21

This is a change inventory for the reconstruction stage committed as `902ad7a`, relative to the audited baseline in `SCIENTIFIC_RECONSTRUCTION_AUDIT_2026-10-19.md`. It is not a release approval. The source audit was read-only; chapter, lab, model, and test changes at that stage are candidate work. The baseline audit itself ran no test suite. The statements below describe that frozen science/reconstruction stage, not later release metadata: on 2026-10-23, the source metadata and editorial date were separately prepared for v1.1.0 candidate validation. Candidate verification below is local and synthetic; exact committed-HEAD evidence is recorded separately in the isolated quality matrix.

## Stage B: paired chapter dispositions

Each row describes the paired English/Korean chapter disposition at reconstruction stage `902ad7a`. “Updated” identifies content in that dated candidate snapshot; it is not a bilingual quality sign-off.

| Chapter pair | Stage B disposition and change in the `902ad7a` snapshot |
|---|---|
| 01 — Control architecture | Updated: worked a five-wafer X-bar signal with explicit known-σ assumptions, 3σ limits, response decision, and original decision-handoff figure; separates signal, product disposition, and authorized control. |
| 02 — Sensor lineage | Updated: populated a synthetic run/wafer/operation join with event and ingestion times, immutable IDs, and a stale prior-run row that is rejected without deleting lineage. |
| 03 — Measurement integrity | Updated: calculates the unchanged 0.020 standard error from 100 independent wafers, contrasts unjustified row-based 0.0141, and corrects Korean “non-normal tails” terminology. |
| 04 — Rational subgroups | Updated: explicit four-wafer Phase I subgroup, known-σ X-bar limits, ordered means and signal; separates control limits from product specifications. |
| 05 — Shewhart/EWMA/CUSUM | Updated: four-point worked trace computes finite-start EWMA variance and CUSUM values and distinguishes no-alarm arithmetic from calibrated ARL/performance. |
| 06 — FDC trace segmentation | Updated: states expected timestamp slots, 117/120 coverage, sample-weighted median under uniform cadence, and explicit irregular-cadence/gap policy; removes an unrelated NIST citation as support for synthetic segmentation choices. |
| 07 — Multivariate false alarms | Updated: computes a two-feature covariance and T² example, gives a separately labeled synthetic run-level confusion table, and warns that example threshold and counts are not joint performance evidence. |
| 08 — Chamber matching | Updated: calculates 12 synthetic matched-lot differences, paired-t interval, predeclared equivalence margin, and clustering/assumption boundaries; avoids equating nonsignificance with equivalence. |
| 09 — Run-to-run APC | Updated: corrects monotone-response error with a run-state table and oscillatory but damped special-case derivation; distinguishes metrology-result delay from actuation delay and holds control when source data are unavailable. |
| 10 — Feedforward/feedback delays | Updated: uses Laplace-domain notation in the concepts and gives a two-lot measurement-arrival example with event/source identity and permissible action timing. |
| 11 — Constraints and safe response | Updated: separates control, product, and equipment boundaries; intersects absolute, move, and equipment-safe bounds to calculate a feasible one-step action and abstention condition. |
| 12 — Alarm management | Updated: calculates finite-horizon alarm burden and all eligible event outcomes, including pre-event competing alarms; separates hysteresis from persistence and corrects Korean terminology. |
| 13 — Synthetic fab cases | Updated: supplies a synthetic per-run evidence ledger, explicit arithmetic and uncertainty boundary, and a discriminating sensor-bias/process-state test without causal or release overclaim. |
| 14 — Verification/governance | Updated: turns a stated slope requirement into populated samples, arithmetic, fault injections, evidence artifacts, and decision rules; distinguishes verification from population validation. |

## Four lab dispositions

| Lab | Stage B disposition and candidate change |
|---|---|
| SPC detection | First-signal outcomes are partitioned into pre-change alarm, post-change detection, and no signal with counts/rates using all trials; finite-horizon full-baseline false alarms and calibration differences are explicit. Model documentation gives units, initial state, recurrence, bounds, seed/trial denominator, and dated baseline numbers. |
| FDC signal intelligence | Per-channel and phase-wide missingness denominators are displayed separately; the implementation exposes all three feature families and avoids treating flags as fault identity. Documentation records 36 correlated feature checks and the bounded 394/1000 prior synthetic probe. |
| Run-to-run APC | Metrology delay `m` is distinct from actuation delay `d`; source run is exposed and unavailable results hold state/action. The model note gives the requested exact plant/measurement equations, clipping, ranges, and only the unsaturated memoryless `0<KcKp<2` criterion; it makes no general stability claim. |
| Alarm strategy | Pre-event alarm, post-event first detection, and no-first-alarm counts are separately exposed with all injected trials as denominator; cross-channel correlation is distinguished from temporal dependence. |

At reconstruction stage `902ad7a`, model/test edits were present in `assets/js/models.mjs`, `assets/js/site.js`, `tests/models.test.mjs`, and `tests/e2e/book.spec.js`. The build preserved the editorial `lastUpdated` field in `library-manifest.json`; a Python regression test checked that behavior with a separate fixture. The baseline audit's SPC and probe figures remain dated baseline evidence, not process-validation evidence for this candidate.

## Local precommit checks and independent review

On 2026-10-21, the full local `npm test` completed successfully on the precommit worktree: generated build and content validation for 14 chapter pairs and four labs; 11 JavaScript model tests; seven Python build/content tests; and 15 Playwright tests across desktop, tablet, and mobile. The new browser test covers readable Chapter 01 diagram labels and focusable, contained Chapter 07 and 09–14 tables in both languages. `git diff --check` passed and a build left `library-manifest.json` unchanged. These checks do not validate production equipment or silicon. The final committed-HEAD run and clean-tree result are tracked separately in the isolated central quality matrix.

Independent Sol High science review inspected four lab models and quantitative examples across all chapters, found the Chapter 12 hourly-denominator defect and bounded unit/source issues, and found no remaining P0/P1/P2 in targeted rereview. An independent Sol High bilingual scientific review compared all 14 EN/KO pairs and four labs and closed its technical parity findings in no more than three targeted rounds. Separate read-only Luna High requirements, security/provenance, and mobile visual QA reviews found no remaining P0/P1/P2 after repair. These are source/code reviews, not external science, human translation, legal, or factory certification.

## Remaining review items

- **P2 — model scope and future field evidence:** thresholds, synthetic distributions, sample sizes, time windows, action bounds, equivalence margin, confusion counts, and instructional safety envelopes remain authored examples. There is no representative process population, equipment identification, calibration study, or qualification evidence. This limitation must accompany any future publication; it is not a claim that the local mathematical tests failed.
- **P3 — visual scope:** the new original Chapter 01 decision figure and wide tables passed focused viewport, touch, and keyboard checks. A broader illustration program and localization of the historical English-only landing SVG remain optional future editorial work.
- **P3 — translation evidence:** independent model-based scientific semantic review covered all 14 pairs and four labs; it does not establish human or native-speaker certification.

At the frozen 2026-10-21 reconstruction stage, no public action or publication was part of this candidate and release metadata had not yet been updated. The separate 2026-10-23 metadata preparation does not establish publication or deployment. The central portal quality matrix records the final source evidence, unresolved limits, and comparison with the other books.
