# Browser pilot runner

The browser runner is a static, dependency-free administration client for the pilot architecture.

## Run locally

From the repository root:

    WORLDVIEW_ENABLE_LEGACY_COLLECTION=true npm run web:serve

Then open:

    http://localhost:4173/apps/web/

## What it does

- loads the active bank/pilot pointers from `data/current.json`;
- generates a deterministic seeded planned-missing packet;
- shows one item at a time;
- supports Likert, importance, moral relevance, single-choice, vignette, paired-choice, and ranking items;
- evaluates conditional branches from prior raw answers;
- guarantees prerequisite items occur before dependent branch items;
- records response times and answer changes;
- autosaves the raw session to browser `localStorage`;
- resumes interrupted sessions;
- exports the exact pilot-session JSON expected by the calibration tools.

## Back navigation

Respondents may move backward to a previously presented item.

If an earlier response is changed, all later raw responses and presentation state are cleared before continuing.

This prevents a branch-dependent response from surviving after the prerequisite answer that made the item eligible has changed.

## Privacy

The static runner does not transmit session data anywhere.

It stores only in local browser storage until the user exports or discards the session.

It does not intentionally collect:

- name;
- email;
- account identifier;
- IP address;
- raw user-agent string.

This compatibility runner uses the older development collector. The public quiz and consented research contribution use a separate frozen-pilot path; see [collection service](COLLECTION_SERVICE.md).

## Results

The runner deliberately displays **no worldview results**.

The engineering scorer remains a command-line smoke-test tool and is explicitly marked non-interpretable.

## Shared runtime

`packages/runtime/index.js` contains the packet, branching, session, and raw-response logic used by both the browser app and Node tooling.

The Node packet generator imports this runtime rather than maintaining a second implementation.
