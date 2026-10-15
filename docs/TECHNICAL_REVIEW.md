# Technical and editorial review

## Internal review record

Status: internal review complete for the current source tree; repository publication, Pages deployment, and My Library evidence remain release gates.

Review scope includes statistical formulas, control recurrence and stability limits, FDC assumptions, synthetic generation, unit/normalization consistency, source claims, bilingual term alignment, accessibility, security, and release workflow.

Required reviewers and outcome:

| Review lane | Result | Evidence / resolved issues |
| --- | --- | --- |
| Semiconductor manufacturing control | PASS — internal independent review, 2026-10-15 | Confirmed differentiated scope against the pinned YieldBook and TestBook revisions. Corrected R2R sign interpretation and made no-shift/full-horizon alarms explicit. No factory or silicon validation is claimed. |
| Numerical/model correctness | PASS — internal independent review, 2026-10-15 | Reviewed analytical recurrences, Wilson probability intervals, conditional delay summaries, valid ranges, and deterministic reference calculations. Added exact bilingual Playwright assertions for point-estimate delay labels. Nine model tests pass; no process-model validation is claimed. |
| Bilingual technical editing | PASS — internal independent review, 2026-10-15 | Aligned `외란` terminology and Chapter 14's reverification/revalidation wording (`유효성 확인`); reviewed matched chapter structure and user-facing laboratory terminology. |
| Architecture and maintainability | PASS — internal independent review, 2026-10-15 | Closed generated-output hygiene finding by ignoring `site/`; verified build-before-test and build-before-upload workflow. Independent source review did not run the suite; local complete `npm test` is recorded below. |
| QA, accessibility and responsive journeys | PASS — internal independent review plus local run, 2026-10-15 | Closed post-run SPC limit, lag recurrence, dropout segmentation, and stale-route findings. Final `npm test`: build/validation passed, model tests 9/9, site tests 6/6, Playwright 12/12 across desktop/tablet/mobile. |
| Security and provenance | PASS — internal independent review, 2026-10-15; rights scope remains explicitly qualified | No secrets, remote runtime data fetch, or upstream material/code reuse found. Updated provenance wording to describe project-declared licenses without asserting transfer or certifying contributor ownership/authority. |
| Requirements and Book Factory integration | PASS — internal independent review, 2026-10-15 | Manifest uses the current schema, includes per-chapter topics and localized simulator kinds, and remains `in-progress`. Portal registration and roadmap transition have not yet occurred. |
| Documentation and release readiness | PASS for source documentation; publication gates pending | Verified conditional `contentReview` validation preserves in-progress records and existing published records. Version alignment, release/tag, deployment evidence, and central publication promotion remain pending. |

These are internal agent reviews, not external professional certification. No result in this table implies factory validation, silicon validation, contributor-rights certification, or legal approval. The source tree has not yet been committed or deployed. Keep the remaining limitations visible in `docs/MODELS_AND_VALIDATION.md` and `docs/RELEASE.md`.
