# 240-question full exploration

> Historical milestone for the initial full route. Version and coverage claims below describe that release, not the current PR #1 baseline. See [the content-efficiency audit](CONTENT_EFFICIENCY_AUDIT.md) for bank v0.9 and public policies v1.1.

The public quiz offers 80, 120, 160, and **240 assigned questions**. The full route
uses more of the existing 562-item bank, not newly invented filler or
repeated questions. Every route retains the 31-facet academic content blueprint.

The full route includes every response scale and complete authored evidence
bundles across ontology, metaphysics, metaethics, ethics, epistemology, values,
mind, agency, religion, meaning, social philosophy, and political philosophy.
The longer form samples more distinctions; length is not a reliability estimate
and does not make a result a validated diagnosis.

## Compatibility

- 80/120/160: unchanged `philosophy-blueprint-1.0.0` / `worldview-public-1.0.0`.
- 240: `philosophy-full-1.0.0` / `worldview-public-240-1.0.0`.
- Shared interpretation: `generic-0.2.0`. No scoring rule or question wording changes.

The browser resolves a saved packet's exact policy version from an explicit
allowlist. Historical pilot backups still use their original generator. Unknown
versions are rejected rather than silently reinterpreted. Research-pilot length
limits and collection contracts are unchanged; this is a local public quiz route.

## Taking a longer quiz

There is no timer. Pause/resume, Back, local backup, raw export, source-linked
results and opt-in sharing remain available. The quiz does not submit answers
automatically. A packet has exactly 240 distinct assigned items, but branch rules
may skip inapplicable follow-ups. Progress and results retain that distinction;
no-view is not silently treated as neutral.

## Tests

Run `npm run test:full-route` and `npm test`. The new suite checks 100 full-route
seeds, domain/facet/format coverage, duplicate exclusion, ordering, conditional
prerequisites, mixed/no-view/all-answer flows, old-backup restoration and frozen
question/model/policy hashes. The browser suite also takes the 240-item route,
pauses near the middle, reloads, resumes, goes Back, and checks results and export.
The optional post-quiz game layer remains isolated from measurement.
