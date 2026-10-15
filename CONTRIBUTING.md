# Contributing

Keep technical claims traceable, label illustrative manufacturing practice separately from statistical/control theory, and preserve the English/Korean meaning of equations, units, caveats, and examples.

Before changing an equation or simulation, update its model note, analytical reference case, and deterministic tests. Keep every example dataset synthetic unless an external dataset is expressly identified and licensed. Do not add recipe values, company identifiers, or production telemetry.

Run `npm run build` and `npm test`. A passing test checks software and documented model behavior; it does not establish that a controller is stable for a real process. Record technical reviewer findings and unresolved limitations in `docs/TECHNICAL_REVIEW.md` before a release.

Do not reuse upstream educational prose, figures, code, or data without an exact file-level provenance and license review. Cite factual sources and preserve notices where required. See `docs/PROVENANCE_AND_REVIEW.md`.
