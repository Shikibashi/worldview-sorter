# Worldview profile matching

## Why this layer exists

A nearest-neighbor algorithm over a small political vector can produce a result that looks precise while being philosophically wrong.

A respondent may be:

- strongly pro-market;
- strongly pro-property;
- secular;
- individualistic;
- skeptical of economic planning;

without being an Objectivist.

Objectivism is a full philosophical system. Its own primary-source description ties together commitments about reality, reason and sensory knowledge, rational self-interest, individual rights, laissez-faire capitalism, and a rights-protecting government.

Political resemblance is therefore not enough to assign the identity label.

## Identity and affinity are different outputs

The matcher separates:

### Affinity

A descriptive similarity between measured constructs and a sourced reference profile.

Affinity may nominate a profile for further comparison.

It is **not** identity.

### Identity

A philosophical-system label such as "Objectivist."

Identity requires:

1. all hard doctrinal gates to pass;
2. sufficient direct evidence;
3. sufficient soft-profile affinity;
4. an empirically calibrated profile catalog;
5. explicit respondent confirmation that the identity label fits.

If any of those conditions is absent, the system must not print the identity label.

## No forced nearest label

The matching policy requires:

- `forceBestMatch = false`;
- `allowAbstention = true`.

Possible outcomes therefore include:

- no match;
- insufficient evidence;
- excluded by doctrine;
- affinity only;
- ambiguous/mixed;
- confirmed identity.

A result page must be able to say:

> No single worldview profile fits closely enough.

That is preferable to inventing a confident identity.

## No "96% match"

The policy has:

```text
percentageMatchAllowed = false
```

An internal affinity value is not a probability that the respondent "is" the philosophy.

The UI must not transform an internal vector similarity into language such as:

- "96% Objectivist";
- "96% match";
- "Your ideology is Objectivism."

Future calibrated results may display an affinity measure, but it must remain labeled as affinity/overlap and accompanied by divergences.

## Objectivism regression profile

Objectivism is the first guardrail profile because it exposes the exact failure mode of broad political matching.

The prototype profile requires direct agreement with four sourced doctrinal probes covering:

1. rational self-interest as a core moral end;
2. sensory evidence integrated by reason rather than revelation/faith as an independent factual source;
3. laissez-faire capitalism with rights-protecting limited government;
4. mind-independent reality.

The soft vector then compares relevant measured constructs such as rights, property, market coordination, revelation, deity belief, and naturalism.

Hard doctrine overrides soft political similarity.

A respondent can therefore score near the political portion of the reference vector and still be explicitly excluded from the Objectivist profile.

## Why government is a gate

This is intentional.

A market anarchist and an Objectivist may overlap on markets, property, individual rights, or opposition to economic regulation while disagreeing about the legitimacy and proper existence of government.

The matcher must preserve that disagreement rather than collapsing both positions into a "libertarian" neighborhood.

## Regression cases

`examples/profile-input.political-only-not-objectivist.json` represents a respondent with extremely high political similarity but direct disagreement with core Objectivist doctrine.

The test suite requires:

- Objectivism state = `excluded`;
- public identity = null;
- overall result = `no_match`.

A second case demonstrates that even doctrinal consistency does not emit a public identity while the catalog remains prototype/unvalidated.

## Figures, countries, and historical analogies

These must remain a separate comparison layer.

A "closest figure" or "closest country" is not evidence that the respondent belongs to that figure's philosophical tradition.

Comparator cards must never feed back into worldview identity classification.

## Future catalog expansion

Each additional philosophy or worldview family should provide:

- sourced core commitments;
- explicit hard-gate doctrine;
- nearby-confusion analysis;
- soft construct targets;
- known disqualifying divergences;
- identity-confirmation wording;
- independent expert review of the profile specification.

Examples that are close neighbors need contrastive gates rather than only separate centroid vectors.

The goal is not to maximize how often the test names an ideology. The goal is to avoid claiming an identity the respondent does not actually hold.
