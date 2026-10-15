# Release checklist

FabControlBook uses independent semantic versioning and GitHub Pages deployment. A My Library catalog status remains `in-progress` until every gate below passes.

1. `npm run build` and all `npm test` suites pass from a clean checkout.
2. An independent reviewer checks each quantitative model's recurrence, assumptions, test cases, and limitations; content/editorial and bilingual review also pass.
3. Rights/provenance records and deployed notices are complete; no unresolved uncertain license is included.
4. Before the stable release, set the book manifest and private package metadata/lockfile to the same version; the npm package is a local test/build harness, not a separately published product.
5. A stable `v1.0.0` release is created only after substantive reviews.
6. GitHub Pages deploy succeeds, and the deployment metadata identifies its full source commit.
7. Every English/Korean chapter route and all four lab routes/anchors return successfully on production; representative accessible desktop/mobile journeys pass.
8. The My Library manifest is promoted only with the release URL/date, exact successful deployment SHA, review notes, live route evidence, and live experiment checks.
9. Portal indexes regenerate and its CI/deploy and production journeys pass. Only then report both publications complete.

When any required external deployment/permission gate fails, keep the local manifest in-progress, retain completed work, and record the exact evidence and blocker.
