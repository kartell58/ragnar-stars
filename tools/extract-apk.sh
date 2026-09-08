#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/tools/apk-out"

die() { echo "ERROR: $*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

if [[ $# -lt 1 ]]; then
  die "usage: extract-apk.sh <apk>"
fi
IN_APK="$1"
[[ -f "$IN_APK" ]] || die "apk not found: $IN_APK"
have unzip || die "unzip is required"
have node || die "node is required"

WORK="$OUT/extracted"
rm -rf "$OUT"
mkdir -p "$OUT"
unzip -q "$IN_APK" -d "$WORK"

echo "==> general info"
file "$IN_APK"
echo "==> native libs"
find "$WORK/lib" -name '*.so' -printf '%P\n' 2>/dev/null || true
LIBG="$(find "$WORK" -name 'libg.so' -print -quit 2>/dev/null || true)"
if [[ -n "$LIBG" ]]; then
  echo "==> libg.so (ELF info)"
  ( readelf -h "$LIBG" 2>/dev/null | grep -E 'Class|Data|Machine' ) || true
  echo "==> relevant strings in libg.so"
  strings -n 8 "$LIBG" 2>/dev/null | grep -aiE 'brawl|version|26\.|9449|9339|\.sc|sc/|https?://|debug' | sort -u | head -40 || true
fi

check_dex() {
  local dex="$1"
  echo "==> $dex"
  strings -n 8 "$dex" 2>/dev/null | grep -aE 'https?://|9449|9339|127\.0\.0\.1' | sort -u | head -20
}
for dex in "$WORK"/classes*.dex; do
  [[ -f "$dex" ]] && check_dex "$dex"
done

echo "==> assets: host/urls"
grep -rhoaE '"https?://[^"]+"' "$WORK/assets" 2>/dev/null | sort -u | head -20 || true

echo "summary saved in $OUT"
ls -l "$OUT"