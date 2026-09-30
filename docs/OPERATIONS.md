# Public application operations

The production public quiz is a static GitHub Pages artifact. The Node HTTP server is a separate development/research utility and is not deployed to the public domain. The public quiz has no accounts, cookies, database, server-side administrations, research upload, feedback API, or product-event API. One current raw quiz is saved in browser `localStorage`; the user can download its raw session or a complete local backup. The separately operated Node utility can write explicitly consented research contributions to a private file store. No migration system exists because there is no production database schema. See [GitHub Pages deployment](DEPLOYMENT.md), [research data and withdrawal](RESEARCH_DATA.md), and [collection API](COLLECTION_SERVICE.md) for these boundaries.

## Build and release

Use Node 20 or later. On the stable `main` commit, the Pages workflow runs `npm test`, `npm run build:production`, a real Chromium test against `dist/pages/`, and an artifact-boundary check before uploading. The output contains only browser modules, runtime JSON, public explanations, and root entry pages. Keep old release artifacts available: restoring a historical quiz requires its bank, form policy, [progressive route definition](PROGRESSIVE_DEPTH.md), interpretation model, result semantics, and affinity catalog. `npm run verify:release` checks the pinned pilot, progressive route manifest, catalog, consent terms, and active references without rewriting artifacts. `server:start` performs this check for the separate Node utility before binding and no longer runs generators at startup. A release should be immutable on the serving host; a change to a frozen artifact requires a new version and manifest rather than editing it in place.

There is no automatic migration or account-data backfill. Rollback is a code-and-content release rollback. Do not roll back to a build that lacks a model or catalog needed by existing browser saves. Research contributions retain their version tuple; the current research-package exporter accepts only the active frozen pilot tuple and fails closed on incompatible records. Add an explicit versioned export path before accepting a later research instrument.

Localization releases add a separate immutable catalog and wording bundles. Keep every referenced historical catalog and bundle available when deploying or rolling back; browser saves pin both plus per-item wording versions. `npm run localization:report` shows which routes are actually available, and `npm run verify:release` checks catalog, bundle, and terminology-inventory hashes. Spanish and Arabic are currently review targets only; [localization release gates](LOCALIZATION.md) must be completed before enabling them.

The current cross-component [model release manifest](../data/releases/model-release-v1.4.0.json) pins inference-relevant artifacts. `npm run verify:governance` checks its hashes, references, route review decisions, source links, derived dependency cycles, and affinity mappings. A semantic change requires a new versioned artifact and an approved [editorial proposal](governance/CONTRIBUTING.md). Keep old manifests and artifacts during deployment and rollback. CI checks existing manifests against the base commit so updating a hash in place cannot conceal a historical change.

Release `1.0.0` does not pin executable inference code. Active release `1.4.0` includes an `engine_source` archive; production build validation checks the live inference modules against its hashes. After changing any archived module, create a new archive with `npm run model:archive-engine -- --version engine-source-X.Y.Z` and publish it through a new model release. Preserve archives with historical model data. Research snapshots of `1.0.0` retain their extraction-time replay limitation.

When a completed local administration has an older release whose inference code cannot be matched to the active release, the browser labels the displayed result as a **current reinterpretation of saved answers**. It disables summary export, sharing, and adding questions under the old release label; raw-answer export stays available. An incomplete administration with unverified historical inference code cannot be continued under the active release. The saved local backup remains available so its raw answers are not discarded. This boundary does not reconstruct the original `1.0.0` executable result.

[Structured beta operations](BETA_OPERATIONS.md) define channels, private feedback triage, health reporting, severity, promotion, and rollback. Channel selection never changes the philosophical model inside an administration; each administration pins its selected manifest and channel.

## Environment

These variables configure the separate Node development/research utility. The GitHub Pages public site uses none of them.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV=production` | Rejects the legacy development collector and requires an explicit research store path if contributions are enabled. |
| `HOST` / `PORT` | Bind address and port; defaults are `127.0.0.1` and `4173`. Put public traffic behind a reviewed TLS reverse proxy. |
| `WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS=true` | Enables new, explicitly consented pilot contributions. Off by default. Withdrawal remains available when this is off if the private store is mounted. |
| `WORLDVIEW_RESEARCH_DIR` | Private, mode-0700 research store. Required when research contributions are enabled in production; place it outside the code release on a backed-up volume. |
| `WORLDVIEW_ENABLE_LEGACY_COLLECTION=true` | Development-only older collector; rejected when `NODE_ENV=production`. |
| `WORLDVIEW_ENABLE_PRODUCT_METRICS=true` | Enables first-party route-use events in structured operational logs. Off by default; no answer payloads or session identifiers are accepted. |
| `WORLDVIEW_STORAGE_DIR` | Older development collector storage path; irrelevant to the public quiz or consented research store. |
| `WORLDVIEW_RELEASE_CHANNEL` | `development`, `internal`, `preview`, `beta`, or `stable`; production defaults to `stable`. Startup rejects a manifest/bundle mismatch. |
| `WORLDVIEW_ENABLE_FEEDBACK=true` | Enables private first-party feedback only when the selected channel flag allows it. Off by default. |
| `WORLDVIEW_FEEDBACK_DIR` | Private mode-0700 feedback and triage store; required when feedback is enabled in production. |

No application secret or account credential is required today. Keep future secrets out of the repository. The Node server speaks HTTP; enforce HTTPS, request-size and proxy logging policies at the deployment edge. Do not log POST bodies, raw answers, withdrawal tokens, or full URLs with private identifiers. The app does not trust `X-Forwarded-For` for its local limiter; a proxy must supply its own rate controls and consider shared-IP users. The server serves only manifest-referenced public JSON; private stores and unlisted data files are not static assets.

## Monitoring and failure response

`GET /api/health` confirms the process can serve requests; it is not an end-to-end research-store check. Startup and request events are JSON lines such as `server_started`, `research_contribution_saved`, `research_contribution_replayed`, `research_contribution_withdrawn`, `research_post_rate_limited`, `research_request_failed`, and `server_request_failed`. Events omit answers, session IDs, receipt tokens, and IPs. Monitor process restarts, 5xx rates, rate limiting, disk free space, store permissions, backup success, and export failures. Browser local-save failures are shown to the user but are not remotely telemetered. Product-event requests are best effort and cannot block answering.

If the research store is failing, turn off new contributions while leaving `WORLDVIEW_RESEARCH_DIR` mounted so withdrawal can continue. Preserve logs without response bodies. For a suspected exposure, restrict public access, preserve a private forensic copy, determine which files and logs were affected, and handle notification and deletion under the applicable operator policy. Do not rely on the UI to invalidate packages already shared externally.

When product metrics are enabled, `GET /api/product/config` discloses the setting and the app sends allowlisted `product_route_event` records: route started/completed/extended, clarification offered/requested/completed, route stopped/paused, page left, browser-save failure, and result-generation failure, plus optional exploration actions. Records contain route ID, answered-item count, and chosen clarification domain where relevant. The server rejects extra fields, identifiers, and response payloads, limits request size and rate, and never logs request bodies. Route completion is emitted on the answering-to-results transition, not when saved results are reopened. Route starts and completions can estimate completion by route; count distributions describe burden; page-left counts indicate exits. These are aggregate product signals, not respondent-level research, psychometric evidence, or exact unique-user rates. Browser reloads and blocked telemetry may affect counts. Operator access logs or a reverse proxy may separately process IP addresses, so configure them accordingly.

## Backup and restoration

The public quiz's local browser save cannot be reconstructed by this server. Users can use **Save existing backup** or **Save raw answers**; clearing browser storage or losing the device can still lose that local attempt.

Quiesce research writes or take a consistent filesystem snapshot before backup. Run:

```bash
node scripts/research-store-recovery.mjs backup --store /private/contributions --out /private/new-backup
node scripts/research-store-recovery.mjs restore --backup /private/new-backup --out /private/new-restored-store
```

Both destinations must be new directories outside the repository. Finalized contribution and withdrawal records are published by atomic rename; a restarted store removes precisely named unpublished temporary files left by an interrupted write. Quiesce writes before backup so no temporary file is in progress. The backup includes active records, withdrawal tombstones, and export audit records with file hashes. Restore verifies hashes and creates a new mode-0700 store without overwriting the old one. Test the restored store with the application in a non-production environment, check active and withdrawn counts, then change `WORLDVIEW_RESEARCH_DIR` to the new path during a controlled restart. Keep the old copy until the restore is verified. Schedule retention and backup deletion under an operator policy; the app has no automatic expiry. The regression suite exercises backup, restore, and corruption rejection using synthetic records.

For an independent-research release, inspect aggregate eligibility with `npm run research:inventory`, then quiesce the contribution store and use `npm run research:snapshot` as described in [the handoff procedure](RESEARCH_HANDOFF.md). It verifies source stability, consented active status, exact versions, snapshot-specific pseudonyms, file hashes, and authored replay. A store change during extraction aborts publication; the operator must still quiesce writes because no cross-process export lock exists. Keep the package private until a named steward approves access and withdrawal/correction handling.

## Launch checklist and limits

Before public exposure, verify the GitHub Pages custom domain, HTTPS, actual asset loading, static browser flow, and absence of collector/server paths. See [the production deployment checklist](DEPLOYMENT.md). The separate research utility still needs access controls, body-free logs, backups, consent/withdrawal handling, and external researcher governance before any independent deployment. The file store supports one server process; multi-instance collection needs a transactional shared store. There are no authenticated-user, account deletion, or database migration journeys to validate in this release. Population and psychometric claims are not implemented.
