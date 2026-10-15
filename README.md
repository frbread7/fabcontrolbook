# FabControlBook

**Semiconductor Manufacturing Control Engineering** · **반도체 제조 제어 엔지니어링**

FabControlBook is a bilingual (English/Korean) professional textbook on how semiconductor manufacturing teams design, evaluate, troubleshoot, and govern monitoring and control systems. Its focus is the engineering chain joining SPC, FDC, APC/R2R, sensor data, manufacturing context, alarms, and reviewed operational response.

The book contains 14 authored chapters and four interactive synthetic-data labs. The models are pedagogical, not calibrated to a production fab. Their mathematical behavior is checked analytically for selected cases and by deterministic automated tests; no factory or silicon validation is claimed.

## Develop locally

```sh
npm ci
npm run build
npm test
```

The builder is standard-library Python and has no network dependency. It validates bilingual completeness, chapter sections, references, and lab anchors before generating the GitHub Pages artifact under `site/`. `npm test` includes deterministic JavaScript model tests, Python content/build checks, and Playwright journeys on desktop, tablet, and mobile.

## Read the book

- English: <https://frbread7.github.io/fabcontrolbook/>
- Korean: <https://frbread7.github.io/fabcontrolbook/ko/>
- Interactive labs: <https://frbread7.github.io/fabcontrolbook/lab.html>
- References and model notes: <https://frbread7.github.io/fabcontrolbook/references.html>

The English/Korean reader pages are generated from `content/`, chapter metadata from `tools/chapters.json`, and verified references from `content/references.json`. All four labs are implemented in `assets/js/models.mjs` and explained in both language editions.

## Related reading

- [WATBook](https://frbread7.github.io/watbook/) — parametric measurement, uncertainty, and engineering evidence.
- [ProcessIntegrationBook](https://frbread7.github.io/processintegrationbook/) — cross-module technology integration.

The detailed overlap and source review is in [`docs/REFERENCE_REVIEW.md`](docs/REFERENCE_REVIEW.md). YieldBook and TestBook are references only. The code and all original educational work are separated by the terms in [`LICENSE.md`](LICENSE.md); rights mappings are in [`docs/PROVENANCE_AND_REVIEW.md`](docs/PROVENANCE_AND_REVIEW.md).

## Repository boundary

FabControlBook is independently authored and versioned. My Library registers verified metadata and links to the independent site; its catalog record is authoritative for publication status. The repository-local manifest remains `in-progress` as the registration input, while the central record is promoted only after the release, deployment, review, chapter, and experiment evidence is complete.
