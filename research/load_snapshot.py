"""Minimal standard-library loader for a restricted Worldview Sorter snapshot."""
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()

def rows(name):
    with (root / name).open(encoding='utf-8') as handle:
        for line in handle:
            if line.strip():
                yield json.loads(line)

snapshot = json.loads((root / 'snapshot.json').read_text(encoding='utf-8'))
administrations = list(rows('administrations.ndjson'))
responses = list(rows('responses.ndjson'))
print(json.dumps({'snapshotId': snapshot['snapshotId'],
                  'administrations': len(administrations), 'responses': len(responses)}))
# Analyze rawValue and missingReason independently of derived.ndjson.
