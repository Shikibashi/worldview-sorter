# Audit flow

```text
version-pinned audit claims
            │
            ├── independent source claims and claim locators
            ├── exact WVS proposition reference (when one exists)
            └── candidate neighbors, non-entailments, limitations
                         │
                         ▼
          active model proposition + rule evidence
                         │
             exact item revision references
                         │
               frozen Quick / Standard / Full routes
                         │
                         ▼
       DIRECT / PARTIAL / ROUTE_LIMITED / UNMEASURED /
       MISSING_PROPOSITION / UNSUITABLE / CONTEXT_ONLY
                         │
                         ▼
          deterministic JSON + human-readable report

The audit ends at instrument coverage. It never feeds back into respondent inference.
```
