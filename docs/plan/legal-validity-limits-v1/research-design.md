# Legal-validity limits and extreme injustice — research and evidence design v1

Baseline: `main` after Model Release 1.20.0 and Reference Profile Catalog 1.3.0.

## 1. Decision & Problem Statement

The active model has an unresolved diagnostic gap around `moral-limits-validity` (`PL21`), currently labeled "Extreme injustice may undermine legal status". While mathematically 50% complete on the Full route (assigning `PLI073@1`, with `PLI072@1` omitted in the candidate bank), admitting `PLI072@1` directly into Full would create severe psychometric and philosophical distortion.

Three load-bearing conceptual problems prevent uncomplicated admission:

1. **Inclusive Legal Positivism False Positive**:
   `PLI072@1` ("A sufficiently unjust rule may fail to count as genuine law even if it was enacted through accepted legal procedures") can be readily affirmed by an inclusive legal positivist whose institutional criteria / rule of recognition incorporate moral constraints (for example, constitutional guarantees of fundamental rights). That agreement does not isolate natural law's claim that injustice invalidates law *independently* of the legal system's accepted institutional criteria.

2. **Conflation of Defective Law and Legal Invalidity**:
   `PLI073@1` currently maps both `not_law` ("Extreme injustice can prevent it from being genuine law") and `defective_law` ("It is law in a defective sense, with moral failure affecting its legal status") to support `moral-limits-validity`. In contemporary jurisprudence (e.g. John Finnis), an unjust law may be morally and rationally defective in the focal sense of law while remaining legally valid. Conflating defectiveness with invalidity distorts respondent interpretation.

3. **Radbruch Threshold Coherence Failure**:
   Gustav Radbruch's famous formula (*Statutory Lawlessness and Supra-Statutory Law*, 1946) holds that positive law remains legally valid even when unjust, *unless* the injustice reaches an intolerable or extreme threshold ("extreme injustice is not law"). Under current mappings, a coherent Radbruch respondent who agrees with `PLI071@1` ("A rule can be legally valid even when it is seriously immoral") and selects `not_law` on `PLI073@1` receives 1 support unit and 1 oppose unit on `source-based-validity` (`PL21`), generating a spurious `mixed_context_dependent` conflict rather than a coherent threshold stance.

### Narrowed Target Proposition

The smallest justified future proposition is:

> **Extreme injustice can make an enactment legally invalid independently of the system's accepted institutional criteria.**

Proposed id: `reviewed-PL21-extreme-injustice-invalidity` (or successor revision of `moral-limits-validity`).

---

## 2. Doctrinal Distinctions & Philosophical Boundaries

| Philosophical Position | View on Moderate Injustice | View on Extreme Injustice | Legal Validity Source |
|---|---|---|---|
| **Natural Law Threshold (Radbruch, Alexy)** | Law remains legally valid though unjust | Extreme injustice deprives enactment of legal validity | Moral limits impose independent threshold on legal validity |
| **Classical Natural Law (Focal sense / Finnis)** | Law is morally defective; validity in technical sense may persist | Technical validity distinct from focal moral-rational authority | Focal concept of law requires common good ordination |
| **Inclusive Legal Positivism (Hart, Coleman, Waluchow)** | Law is valid if enacted per institutional criteria | Injustice invalidates *only if* the system's own rule of recognition incorporates moral tests | Social sources and institutional conventions determine whether morality is a condition of validity |
| **Exclusive Legal Positivism (Raz, Gardner)** | Law is valid purely based on social sources | Injustice never invalidates law; morality determines duty to obey, not legal validity | Social sources exclusively; moral merits never determine legal validity |
| **Legal Validity without Moral Obedience (Hart 1958)** | Law is valid | Law remains valid; citizens may have a moral duty to disobey or resist | Legal validity is strictly descriptive; moral obligation to obey is separate |

---

## 3. Current Item & Route Audit

### Assigned on Full Route (251 items)
- **`PLI071@1`** (Likert): "A rule can be legally valid even when it is seriously immoral."
  - Mapped to: `source-based-validity` (support: 1, 2; oppose: -2, -1).
- **`PLI073@1`** (`PL-S18`, vignette choice): "A regime enacts a rule through all of its recognized legal procedures, but the rule is profoundly unjust. Which is closest to your view?"
  - Options:
    - `valid_but_unjust`: "It can be valid law while being profoundly unjust." (opposes `moral-limits-validity`; supports `source-based-validity`).
    - `defective_law`: "It is law in a defective sense, with moral failure affecting its legal status." (supports `moral-limits-validity`; ignored by `source-based-validity`).
    - `not_law`: "Extreme injustice can prevent it from being genuine law." (supports `moral-limits-validity`; opposes `source-based-validity`).
    - `depends`: "It depends on the legal system's own criteria." (nondirectional).
  - Pilot Content Review status: Reviewed in `content-review-v1.11.json` with `decision: "retain_for_pilot"`, `issue: "legal_jargon"`, `rationale: "Different meanings of legal validity require comprehension checking; the options are not a generic obedience scale."`

### Omitted Bank Item (Outside Full Route)
- **`PLI072@1`** (Likert): "A sufficiently unjust rule may fail to count as genuine law even if it was enacted through the accepted legal procedures."
  - Mapped to: `moral-limits-validity` (support: 1, 2; oppose: -2, -1).
  - Pilot Content Review status: **No recorded review decision** in `content-review-v1.11.json`.

---

## 4. Co-Review Requirements for Affected Inference Rules

Both rules under construct `PL21` must be co-reviewed before any route change:

1. **`moral-limits-validity`**:
   - Must NOT treat `defective_law` as interchangeable with `not_law`.
   - Must explicitly test independent invalidation at the extreme threshold.
   - Must distinguish institutional legal validity from moral duty to obey.

2. **`source-based-validity`**:
   - Must avoid penalizing threshold respondents who affirm source-based validity for ordinary/serious injustice while recognizing extreme limits.
   - Coherent threshold combinations (`PLI071:agree` + `PLI073:not_law`) must receive an appropriate lean or qualified diagnostic interpretation rather than an internal conflict.

---

## 5. Source Ledger Grounding Plan

The source ledger (`data/generic/source-ledger-v*.json`) currently cites generic legal philosophy (`gen-law`), which supports the separation of legal validity from moral obligation to obey, but lacks exact citations for the threshold and defective-law doctrines. Future rule revision must link to:

1. **Radbruch, Gustav (1946)**: "Statutory Lawlessness and Supra-Statutory Law" (*Gesetzliches Unrecht und übergesetzliches Recht*), *Süddeutsche Juristen-Zeitung*.
   - Supports: Extreme injustice invalidating positive enactments independently of institutional criteria (Radbruch formula).
2. **Finnis, John (1980)**: *Natural Law and Natural Rights*, Oxford University Press, Chapters I and XII.
   - Supports: Defective law in focal sense vs. sheer legal invalidity; *lex injusta non est lex* as an adage about moral obligation and central-case law.
3. **Hart, H.L.A. (1958)**: "Positivism and the Separation of Law and Morals", *Harvard Law Review* 71(4): 593–629.
   - Supports: Legal validity distinct from moral evaluation and duty to obey; critique of Radbruch.
4. **Alexy, Robert (2002)**: *The Argument from Injustice: A Reply to Legal Positivism*, Oxford University Press.
   - Supports: Analytical reconstruction of the threshold connection between extreme injustice and legal invalidity.

---

## 6. Governance Boundary & Sequencing

- **Active Questionnaire**: Remains strictly unchanged (251 items on Full, 64 on Quick, 120 on Standard).
- **Active Model Scoring**: `moral-limits-validity` remains `not_measured` on all routes until a successor release incorporates the co-reviewed items and rules.
- **Historical Compatibility**: Preserved byte-for-byte; prior route reviews and pilot sessions are unaffected.
