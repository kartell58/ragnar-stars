#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="$ROOT/dist/ragnarstars-signed.apk"
PKG="com.supercell.brawlstars"
LAUNCH="com.supercell.brawlstars.GameApp"
PORT="${REDIRECT_PORT:-9339}"

have() { command -v "$1" >/dev/null 2>&1; }
have adb || { echo "adb is required" >&2; exit 1; }
[[ -f "$APK" ]] || { echo "APK not found. Run tools/build-client.sh first." >&2; exit 1; }

[[ -S /dev/null ]] && adb start-server >/dev/null 2>&1 || true
adb wait-for-device
adb devices -l | sed -n '1,3p'

echo "==> installing (if the official one is installed, uninstall it first: adb uninstall $PKG)"
adb install -r "$APK"

echo "==> adb reverse (device:127.0.0.1:$PORT -> host:$PORT)"
adb reverse "tcp:$PORT" "tcp:$PORT"
adb reverse --list

echo "==> clearing logcat and opening the game"
adb logcat -c
adb shell am start -n "$LAUNCH" || adb shell monkey -p "$PKG" 1 >/dev/null
sleep 3

echo "==> looking for gadget signs (tags Frida / RagnarStars)"
adb logcat -d -s Frida:D Frida:V AndroidRuntime:E '*:S' | grep -iE 'RagnarStars|gadget|frida' | tail -30 || true

echo "==> extracted libs (should list librs*.so besides libg.so)"
APKDIR="$(adb shell pm path $PKG 2>/dev/null | sed 's|package:||; s|/base.apk$||')"
for abi in arm arm64; do
  echo "-- $abi:"; adb shell "ls -1 $APKDIR/lib/$abi 2>/dev/null" | grep -E 'librs|libg\.so' || true
done
echo
echo "==> hint: to disable the redirect: adb reverse --remove-all"