#!/usr/bin/env bash
#
# npm run check — full static gate before committing (mirrors what the repo
# requires: no build step, no typecheck — just syntax + the smoke suites + lint).
#
#   1. bash -n            shell scripts (build-client.sh et al.)
#   2. node --check       every CommonJS .js under src/ scripts/ config/ tools/
#                         (tools/apkmerge is vendored ESM and stays excluded)
#   3. npm run smoke      config-smoke + packets-smoke + db-smoke
#   4. npm run lint       eslint . --ext .js
#
# Exits non-zero on the first failing stage (set -e), with a FAIL line naming
# the offending file so it can be fixed in one shot.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [1/4] bash -n (shell scripts)"
while IFS= read -r -d '' f; do
  bash -n "$f"
  echo "    OK $f"
done < <(find . -name '*.sh' -not -path './node_modules/*' -print0 | sort -z)

echo "==> [2/4] node --check (CommonJS server code)"
while IFS= read -r -d '' f; do
  node --check "$f" >/dev/null
  echo "    OK $f"
done < <(find src scripts config tools -name '*.js' \
  -not -path 'tools/apkmerge/*' -not -path '*/node_modules/*' -print0 | sort -z)

echo "==> [3/4] npm run smoke"
npm run smoke

echo "==> [4/4] npm run lint"
npm run lint

echo
echo "CHECK OK"