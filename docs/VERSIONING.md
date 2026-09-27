# Versioning and identity

The project separates historical observations from interpretations.

## Permanent IDs

Construct IDs such as `ME01` and future item IDs are permanent identifiers.

- Never recycle a retired ID.
- Renaming a construct does not change its ID.
- Substantive redefinition requires a new construct ID.
- Deprecated constructs remain decodable in historical sessions.

## Independent versions

At minimum, production data must track:

- `schemaVersion` — shape of serialized records.
- `registryVersion` — construct/domain registry.
- `instrumentVersion` — exact set and revisions of items presented.
- `itemRevision` — wording/content revision of an item.
- `scoringModelVersion` — factor/IRT/keyed-scoring parameters.
- `profileModelVersion` — philosophical/worldview reference profiles.

These versions must not be collapsed into one application version.

## Raw responses are canonical

A historical session stores the exact item IDs/revisions shown and the raw response state.

Derived scores are disposable snapshots.

When scoring model 2.0 replaces 1.0, old raw sessions should be rescorable without changing what the respondent originally answered.

## Neutral is data

For Likert-style items:

- `answered + 0` means a genuine midpoint/neutral response.
- `no_view` means the respondent declines to express a view.
- `not_understood` means comprehension was insufficient.
- `not_applicable` means the proposition does not apply.

These states must never be serialized as the same numeric value.

## Instrument manifests

Every released form must have an immutable manifest mapping its compact item index to:

- permanent item ID;
- item revision;
- response scale;
- branch/eligibility rule.

A share code may compress by manifest position, but it must contain the instrument version needed to reconstruct that mapping.

## Scoring evolution

Hand-authored v0.x loadings are hypotheses.

Later calibration may change:

- item loadings;
- discrimination;
- thresholds;
- factor structure;
- short-form membership;
- construct promotion/demotion;
- profile matching.

None of those changes may mutate historical raw-response data.
