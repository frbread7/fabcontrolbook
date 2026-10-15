# Provenance and publication review record

## Material map

| Classification | Reviewed source / destination | Rights observation and status |
| --- | --- | --- |
| Original educational content | Newly authored `content/en/chapters/*.html`, `content/ko/chapters/*.html`, `content/*/lab.html`, landing/reference/license page copy, and `art/control-hierarchy.svg`; the project declares CC BY 4.0 licensing with attribution to frbread7 and contributors. | The project describes this material as original; no upstream content was intentionally copied or translated. No contributor assignment or ownership evidence is included here, so this review does not certify every contributor's ownership or authority to license their contribution. |
| Original software | `tools/build_site.py`, `assets/js/*.mjs`, `assets/js/site.js`, `assets/css/site.css`, tests and workflow; the project declares MIT licensing with attribution to frbread7 and contributors. | The project describes this material as original. No contributor assignment or ownership evidence is included here, so this review does not certify every contributor's ownership or authority to license their contribution. Build/test tooling has separately identified development dependencies. |
| Synthetic data | Data generated at runtime from fixed-seed PRNG and declared equations in `assets/js/models.mjs`; used only for education. | Original synthetic examples; not copied from a public or private manufacturing dataset. |
| Reference-only | YieldBook four reviewed chapters; TestBook two reviewed chapters, exact revisions and file links recorded in `content/references.json` and `docs/REFERENCE_REVIEW.md`. | `LICENSE.md` at each pinned source revision separately scopes educational material as CC BY 4.0 and software as MIT, while excluding/deferring external rights. No expression or code was adapted. |
| Third-party material | Bibliographic metadata and links only; no embedded third-party images, fonts, assets, standards text, or datasets. | External source rights remain with their providers. Links do not grant reuse permission. |

## Original-text and art review

The book chapters and translations were composed for this project; equations express standard mathematical relationships and factual statements cite references. Upstream chapter text and figures were consulted for scope boundaries only, not translated or paraphrased. The SVG artwork is authored in this repository. All lab/case datasets are generated. The code and text license boundary is purpose-based as described by `LICENSE.md`.

## Rights gates before release

- [x] Exact source revisions and reviewed paths are recorded.
- [x] Each upstream book's code/content license split was read at the pinned revision; third-party terms remain separate.
- [x] Upstream use is `reference-only`; no upstream code/content/asset reuse is claimed.
- [x] Original educational content and original code have distinct declared licenses.
- [x] The generated site artifact includes the licensed notices. Initial in-progress Pages deployment succeeded from source revision `cd31cb3909c9f28662fa2ca5a8b283a75d9b0c61` ([Actions run 38666002897](https://github.com/frbread7/fabcontrolbook/actions/runs/38666002897)); all 39 generated resources (36 HTML routes and 3 SVG/JavaScript assets) returned HTTP 200, and production Playwright passed 12/12 across desktop, tablet, and mobile. The 1.0.0 manifest-alignment revision `67f67f8058fa1db12f60363bac18434e978a3466` was also deployed successfully ([run 38666815992](https://github.com/frbread7/fabcontrolbook/actions/runs/38666815992)) and passed the same 39-resource and 12/12 production checks. These are pre-release checks; the final stable-release deployment is still gated.
- [x] Internal independent technical, content, bilingual, architecture, QA, requirements, security, and provenance review is recorded in `docs/TECHNICAL_REVIEW.md`; no P0/P1 findings remain and the reviewed P2 findings are closed. This is not legal approval or contributor-rights certification.
- [ ] Stable v1.0.0 release, its successful Pages deployment, and final live chapter/lab checks all match a single full source revision.
- [ ] The final My Library registration records release, deployment, review, route, experiment, and provenance evidence.

This record identifies reviewed material, not every possible third-party right. License and attribution statements above record the project's declarations; they do not establish a transfer or certify contributor ownership or authority. Automated checks do not certify authorship, license applicability, non-infringement, or legal compliance. The review is not legal advice.
