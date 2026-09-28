# Remote collection service

The collection service serves the static pilot runner and accepts immutable raw pilot sessions using the same schema as local JSON export.

## Start

```bash
npm run server:start
```

Default:

```text
http://127.0.0.1:4173/apps/web/
```

Environment variables:

- `PORT` — HTTP port, default 4173.
- `HOST` — bind host, default 127.0.0.1.
- `WORLDVIEW_STORAGE_DIR` — session storage directory, default `.data/pilot-sessions`.
- `WORLDVIEW_ADMIN_TOKEN` — enables protected research export.

## API

### GET /api/health

Returns active pilot, bank, and instrument versions.

### GET /api/pilot/config

Returns public pilot packet-size configuration.

### POST /api/pilot/sessions

Accepts one raw pilot-session JSON object.

Server validation regenerates the packet from:

- active bank;
- pilot configuration;
- submitted randomization seed;
- packet size;
- packet ID.

It then verifies:

- pilot/bank/instrument versions;
- exact item order;
- exact item revisions;
- domains and response scales;
- response values against item/scale definitions;
- branch eligibility;
- branch-skipped state;
- completed-session completeness;
- timing/change-count shape;
- allowed JSON fields.

Unknown fields are rejected. This prevents clients from silently adding names, emails, IP addresses, or arbitrary metadata to stored session records.

### Immutable create semantics

One file is stored per `sessionId`.

- First valid submission: HTTP 201.
- Identical resubmission: HTTP 200 with `duplicate: true`.
- Same session ID with different content: HTTP 409.

This makes browser retries safe without allowing silent mutation of historical responses.

## Storage

Default local storage:

```text
.data/pilot-sessions/<sessionId>.json
```

Files are created with restrictive file permissions where supported.

The service does not persist request IP addresses or raw user-agent strings.

## Research export

Set an admin token:

```bash
WORLDVIEW_ADMIN_TOKEN='replace-me' npm run server:start
```

Then:

```bash
curl -H 'Authorization: Bearer replace-me' \
  http://127.0.0.1:4173/api/research/export
```

The response is NDJSON.

Any optional `respondentKey` is removed from research-export records.

Without `WORLDVIEW_ADMIN_TOKEN`, the export endpoint returns HTTP 503 rather than exposing sessions.

## Browser behavior

At completion the browser runner posts the raw session to `/api/pilot/sessions` when the health endpoint indicates a compatible collector.

If the collector is unavailable or submission fails:

- local autosave remains intact;
- raw JSON export remains available;
- the user can retry submission.

The server does not calculate worldview scores.
