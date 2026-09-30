# Application collection service

`npm run server:start` serves the browser-first quiz at `http://127.0.0.1:4173/apps/quiz/`. The app has no accounts and does not submit answers automatically. Its browser storage and user-initiated JSON backup are operational data. Optional first-party route-use events are disabled by default; see [operations](OPERATIONS.md) for the allowlist and privacy boundary.

`HOST` and `PORT` select the bind address and port. Use a reviewed TLS reverse proxy and hosting log policy for public deployment; the Node server itself is plain HTTP. `GET /api/health` reports the legacy pilot config; `GET /api/research/config` reports whether the current optional research contribution feature is enabled.

## Optional research contribution

Set `WORLDVIEW_ENABLE_RESEARCH_CONTRIBUTIONS=true` and place `WORLDVIEW_RESEARCH_DIR` on a private, access-controlled, backed-up volume. Default storage is `.data/research-contributions`; it is separate from application browser storage and the legacy collector. The client shows the hash-pinned consent terms supplied by the server after results. It sends a frozen pilot attempt only after an unchecked consent box is selected and the submit button is pressed. Each attempt gets its own consent version and withdrawal receipt. See [data, consent, and research handoff](RESEARCH_DATA.md).

`POST /api/research/contributions` accepts only JSON with `{consentVersion, affirmed: true, quiz, linkId?, contributionId?, withdrawalToken?}`. The optional client receipt fields must occur together. The public client saves a random private receipt locally before sending; replaying the same attempt with that receipt returns the original confirmation without a second contribution. A different receipt for the same active attempt is rejected. Older clients without receipt fields receive a server-generated receipt but cannot recover it after a lost response. The server validates the exact packet, revisions, response meanings, model/catalog version, and allowed fields. `DELETE /api/research/contributions/:id` with the receipt's Bearer token replaces that record with a response-free tombstone. These endpoints should have deployment-layer rate and abuse controls before public exposure. The optional stable link is a research-only browser secret; it is never a required account.

The application limits research POST attempts to 30 per connection IP per ten minutes, bounds JSON bodies to 2 MB and request time to 60 seconds, and emits structured events without answers, tokens, session IDs, or IPs. A reverse proxy may make many users appear under one IP, so production proxy rate controls and load testing still need review. The limiter is in memory and does not coordinate multiple processes.

Turning off new contributions leaves receipt-based withdrawal available for records already in the private store. The browser keeps receipts separately from the current quiz and offers withdrawal even after a retake. Operators must keep the private store mounted while outstanding receipts may be used.

The old `GET /api/research/export` returns HTTP 410 even with an old admin token. Only an authorized **offline** command can create a consent-filtered package:

```bash
node scripts/export-research-package.mjs --store /private/contributions --out /private/new-package
```

The output is an access-controlled research handoff, not an automatic public release. The command records an export audit. Run it from a consistent private store snapshot or while contribution writes are quiesced. Review legal basis, permissions, retention, backups, logs, external researcher terms, and withdrawal handling before operating or sharing real data. The file-backed store is intended for one server process; a multi-instance deployment needs a transactional shared store and equivalent withdrawal/export guarantees.

## Development compatibility collector

The older `/apps/web/` and `POST /api/pilot/sessions` are disabled by default. `WORLDVIEW_ENABLE_LEGACY_COLLECTION=true` enables them only for the older research-pool development workflow; `WORLDVIEW_STORAGE_DIR` selects its separate storage. That flow stores full submitted sessions, may include an opaque respondent key, and has no research-consent boundary. It must not be confused with the production opt-in or used to source a research package. Existing local runner and session tests remain compatibility checks.
