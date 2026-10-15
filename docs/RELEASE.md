# Release record

FabControlBook uses semantic versions and independent GitHub Pages deployments. The book repository's manifest stays `in-progress` because My Library is the authority for publication status.

## Release process

1. Run `npm test` from a clean checkout. It builds the Pages artifact and checks bilingual chapters, references, model calculations, and responsive browser journeys.
2. Complete independent technical, numerical, editorial, bilingual, accessibility, security, requirements, and documentation review. Clearly distinguish analytical checks from silicon or factory validation.
3. Verify the file-level provenance record and include the declared content/software notices in the deployed artifact. Unresolved license uncertainty blocks release.
4. Align `package.json`, `package-lock.json`, and `library-manifest.json` before making a versioned release. The private npm package is only a build/test harness.
5. Push the validated revision to `main`; require the GitHub Pages workflow and deployment to succeed at that exact source SHA.
6. Verify every English/Korean chapter route, four lab anchors, full generated artifact inventory, and desktop/tablet/mobile journeys on production.
7. Create the GitHub release at the deployed revision. The central My Library record is promoted only after its release, source SHA, CI/deployment, chapter, experiment, review, and provenance evidence passes validation.
8. Regenerate and validate portal indexes, deploy My Library, then repeat the portal production journey checks. Record the final status in the portal manifest; never promote an incomplete book.

## Release history and source of truth

- **v1.0.0** is the technical-content release at source revision `2dfb22bf86759c0e273ec95e4d394f7e3255a366`. The original v1.0.0 tag and source SHA are preserved; the GitHub Actions run and Pages deployment are recorded in My Library.
- **v1.0.1** designates a documentation and release-record correction. It changes no chapter, model, or simulator behavior. The package and repository manifest are aligned for this patch.
- My Library is the canonical source for publication status, current release URL, exact deployed SHA, experiment verification, CI/deployment run, and production checks: [FabControlBook manifest](https://github.com/frbread7/books/blob/main/catalog/books/fabcontrolbook.json).
- The book repository-local manifest deliberately remains `in-progress`. My Library's central catalog alone determines publication status and records release/deployment evidence after its publication gate passes.

## Validation limits

Production verification establishes that deployed routes and interactive code load and that deterministic numerical checks match the documented equations. It does not establish real-silicon accuracy, calibration to a production fab, external professional certification, contributor ownership, or legal approval.
