# Reference and differentiation review

Review completed before chapter authoring on 2026-10-15. The successful deterministic monitor preflight at `2026-10-15T00:53:44Z` observed 43 upstream catalog entries (37 repository-backed) at central catalog revision `f51e57c03c6bd42c6bccc976feb75126483ebdfd`. It reported 11 source changes, all limited to AIBook; `affectedProjects` was empty for FabControlBook. Those observations were not accepted as reviewed changes and did not alter the FabControlBook source pins.

The canonical My Library editorial decision is `original-deeper-treatment`, high confidence. Its source pins remain the reviewed revisions; this work did not silently advance them.

## Pinned materials inspected

| Source | Revision and reviewed paths | Existing focus relevant to this book | Differentiated FabControlBook purpose |
| --- | --- | --- | --- |
| [YieldBook](https://github.com/geniuskey/yieldbook/tree/2acd8844633274ebea91e808c4a22ed4035549b8) | `2acd8844633274ebea91e808c4a22ed4035549b8`; `chapters/statistics.html`, `signature.html`, `classify.html`, `commonality.html`; `LICENSE.md`, `LICENSE-CC-BY-4.0`, `LICENSE-MIT` | Wafer-map pattern statistics, equipment-signature interpretation, defect review/classification, lot commonality and root-cause investigation. The commonality chapter connects FDC alerts and SPC charts as context. | Define the end-to-end control architecture and operational contract: data lineage, rational sampling, sequential chart behavior, phase-aware sensor features, multivariate false-alarm governance, controller dynamics, constraints, alarm burden, and post-change validation. Reuse only through reference links, not duplicated foundations. |
| [TestBook](https://github.com/geniuskey/testbook/tree/a69997b5bee01346d44c864bed2cc3304b8571e5) | `a69997b5bee01346d44c864bed2cc3304b8571e5`; `chapters/limits.html`, `dc.html`; `LICENSE.md`, `LICENSE-CC-BY-4.0`, `LICENSE-MIT` | Test limits/guardbands, capability, measurement-system variation, DC parametric test sequencing and settling-time/accuracy tradeoffs. | Treat measurement quality as a control-system input and operational context; do not repeat device-test content. Use reference links for MSA and test-measurement background. |

The live repository head APIs were checked in the current completion pass and still return the pinned YieldBook/TestBook SHAs. Fetched file blob IDs matched the inventory. Upstream repository API license metadata is `NOASSERTION`; the inspected `LICENSE.md` files explicitly separate MIT software from CC BY 4.0 educational material and state that external materials have their own terms. The specific selected source material was used reference-only. This reading is not permission to reuse any particular embedded asset. A later attempt to rerun the full central-catalog monitor ended with an upstream connection reset (`Remote end closed connection without response`); it produced no inventory update. The successful pre-authoring run and direct head checks remain the evidence for these scoped pins.

## Bibliographic checks and corrections

An independent source check corrected several citation records before release:

- Liu et al.'s run-to-run control survey is **2018**, *ISA Transactions* 83, pp. 107–125, DOI `10.1016/j.isatra.2018.09.005`; the previous year/volume/page combination was incorrect.
- DOI `10.1021/ie1008053` is by R. Good and S. J. Qin, *Industrial & Engineering Chemistry Research* 50(3), pp. 1400–1409 (2011 issue; published online 2010), not H. H. Lee.
- The cited Springer DOI ending `_255-1` identifies James Moyne's original 2014 entry. Springer lists a distinct later 2019 version; the chapters now state which edition is cited.
- `ISO 5725-1:2023` links to its ISO catalog entry (`69418`); the earlier `59752` link identified ISO 13485:2016 and was replaced.
- NIST EWMA and CUSUM references now point to the relevant EWMA section (`pmc324.htm`) and CUSUM ARL section (`pmc3231.htm`).

Publisher pages that returned HTTP 403 to the automated research environment were treated as access-restricted/inconclusive, not as evidence that a citation is invalid. Bibliographic metadata was compared with available publisher/DOI records; standards text is not reproduced.

## Development decision

- **Audience:** semiconductor process, equipment, integration, yield, manufacturing-control, and data engineers with graduate-level statistics/control foundations.
- **Unique educational value:** a professional course about designing and governing closed-loop manufacturing monitoring and control, including evidence quality, alarms, and safe disposition—not an introductory yield, SPC, or electrical test book.
- **Strategy:** original deeper treatment. Create independently authored bilingual explanations, figures, examples, and simulations. Link to YieldBook/TestBook for their particular material.
- **Reuse:** reference-only. No adaptation, copied source snippets, simulator source, artwork, or datasets. Every lab/case dataset is generated by FabControlBook and explicitly synthetic.
- **Confidence:** high for the scoped differentiation. Limits: the review is not an exhaustive semantic comparison of every line across all 37 upstream books.

## Chapter-level differentiation map

1. System architecture, context and lineage, data integrity, rational subgrouping, detection theory: expands common SPC concepts into a traceable monitoring design.
2. FDC trace segmentation/features, multivariate scoring, chamber/tool drift: extends beyond YieldBook's wafer-defect signatures and commonality; it treats time-series equipment signals and validated response.
3. R2R/APC, feedforward/feedback, delay, constraints, alarm response and governance: control theory and production operations, distinct from TestBook's test-flow/limits and YieldBook's yield diagnosis.
4. Integrated synthetic excursions and change verification: evidence-chain case studies and closed-loop governance, not a copied upstream narrative or dataset.

This review supports starting and releasing a separate textbook. It does not pre-approve reuse, guarantee that every chapter will meet its intended depth, or establish that upstream authors have no overlapping subject matter.
