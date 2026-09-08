#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRIDA_VERSION="${FRIDA_VERSION:-16.1.10}"
BASE_APK="${BASE_APK:-$ROOT/tools/apks/brawlstars.apk}"
REDIRECT_HOST="${REDIRECT_HOST:-127.0.0.1}"
REDIRECT_PORT="${REDIRECT_PORT:-9339}"
BUILD="$ROOT/build"
STAGE="$BUILD/stage"
OUT="$ROOT/dist/ragnarstars-unsigned.apk"
SIGNED="$ROOT/dist/ragnarstars-signed.apk"
KS="$ROOT/ragnarstars.jks"
KS_ALIAS="ragnarstars"
if [[ -n "${ABIS:-}" ]]; then
  read -r -a ABIS <<< "$ABIS"
else
  ABIS=("armeabi-v7a")
fi
GADGET_ABI_armeabi_v7a="arm"
GADGET_ABI_arm64_v8a="arm64"
GADGET_PREFIX="${GADGET_PREFIX:-librs}"
GADGET_SCRIPT="${GADGET_SCRIPT:-$ROOT/tools/gadget/krtl-gadget.js}"
PACKAGE_NAME="${PACKAGE_NAME:-com.ragnarstars.client}"
ORIGINAL_PACKAGE="${ORIGINAL_PACKAGE:-com.supercell.brawlstars}"

die() { echo "ERROR: $*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

PATCHELF="$(command -v patchelf || true)"
[[ -z "$PATCHELF" && -x /tmp/ptf/usr/bin/patchelf ]] && PATCHELF=/tmp/ptf/usr/bin/patchelf
[[ -n "$PATCHELF" ]] || die "patchelf is required"
have curl || die "curl is required"
have unxz || die "unxz is required"
have python3 || die "python3 is required"
have node || die "node is required"
have apksigner || die "apksigner is required"
have zipalign || die "zipalign is required"
have keytool || die "keytool is required"
[[ -f "$BASE_APK" ]] || die "base apk not found: $BASE_APK (use BASE_APK=/path/to/original-apk ./tools/build-client.sh)"

rm -rf "$BUILD"
mkdir -p "$STAGE" "$ROOT/dist" "$BUILD/dl"

echo "==> downloading frida-gadget $FRIDA_VERSION (ABIs: ${ABIS[*]})"
for abi in "${ABIS[@]}"; do
  gabi="GADGET_ABI_${abi//-/_}"; gabi="${!gabi}"
  curl -fSL -o "$BUILD/dl/gadget-$abi.so.xz" \
    "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-gadget-${FRIDA_VERSION}-android-${gabi}.so.xz"
  unxz -f "$BUILD/dl/gadget-$abi.so.xz"
done

echo "==> libg.so: ${PATCH_LIBG:-1}"
for abi in "${ABIS[@]}"; do
  mkdir -p "$STAGE/lib/$abi"
  unzip -o -q "$BASE_APK" "lib/$abi/libg.so" -d "$BUILD/extract"
  if [[ "${PATCH_LIBG:-1}" == "1" ]]; then
    cp "$BUILD/extract/lib/$abi/libg.so" "$STAGE/lib/$abi/libg.so"
    "$PATCHELF" --add-needed "$GADGET_PREFIX.so" "$STAGE/lib/$abi/libg.so"
  else
    cp "$BUILD/extract/lib/$abi/libg.so" "$STAGE/lib/$abi/libg.so"
  fi
  cp "$BUILD/dl/gadget-$abi.so" "$STAGE/lib/$abi/$GADGET_PREFIX.so"
done

echo "==> gadget config + script (host=$REDIRECT_HOST port=$REDIRECT_PORT prefix=$GADGET_PREFIX)"
for abi in "${ABIS[@]}"; do
  cat > "$STAGE/lib/$abi/$GADGET_PREFIX.config.so" <<EOF
{
   "interaction":{
      "type":"script",
      "path":"$GADGET_PREFIX.script.so",
      "on_change":"reload",
      "parameters":{
         "redirectHost":"$REDIRECT_HOST",
         "redirectPort":"$REDIRECT_PORT"
      }
   }
}
EOF
  cp "${GADGET_SCRIPT:-$ROOT/tools/gadget/krtl-gadget.js}" "$STAGE/lib/$abi/$GADGET_PREFIX.script.so"
done

echo "==> packaging APK"
DROP=()
for a in arm64-v8a armeabi-v7a x86 x86_64; do
  keep=0
  for b in "${ABIS[@]}"; do [[ "$a" == "$b" ]] && keep=1; done
  [[ $keep -eq 0 ]] && DROP+=("lib/$a/")
done
DROP_STR="$(IFS=,; echo "${DROP[*]}")"
BASE_APK="$BASE_APK" OUT_APK="$OUT" STAGE_DIR="$STAGE" DROP_PREFIX="$DROP_STR" node "$ROOT/tools/repack-client.js"

if [[ -n "${PACKAGE_NAME:-}" ]]; then
  echo "==> renaming package to $PACKAGE_NAME"
  python3 "$ROOT/tools/patch-manifest-package.py" "$OUT" "${ORIGINAL_PACKAGE:-com.supercell.brawlstars}" "$PACKAGE_NAME"
fi

echo "==> zipalign + signing"
zipalign -f -p 4 "$OUT" "$BUILD/aligned.apk"
if [[ ! -f "$KS" ]]; then
  keytool -genkeypair -keystore "$KS" -alias "$KS_ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "${KEYSTORE_PASS:-ragnarstars}" -keypass "${KEYSTORE_PASS:-ragnarstars}" \
    -dname "CN=RagnarStars,O=RagnarStars,C=BR" -noprompt
fi
apksigner sign --ks "$KS" --ks-key-alias "$KS_ALIAS" --ks-pass "pass:${KEYSTORE_PASS:-ragnarstars}" \
  --key-pass "pass:${KEYSTORE_PASS:-ragnarstars}" --out "$SIGNED" "$BUILD/aligned.apk"
apksigner verify -v "$SIGNED" | head -6
sha256sum "$SIGNED"

echo "OK: $SIGNED"
