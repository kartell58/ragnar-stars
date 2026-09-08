/**
 * APK repacker — the merge step of the client build. Takes the base APK
 * (tools/apks/brawlstars.apk or $BASE_APK) and overlays every file staged in
 * $STAGE_DIR (e.g. the gadget + patched manifest), keeps resources.arsc
 * STORED (never compress it — the runtime mmaps it), drops $DROP_PREFIX
 * prefixes, and writes dist/ragnarstars-unsigned.apk for the signing step.
 * The actual zip surgery is delegated to an inline python3 helper.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE_APK || path.join(ROOT, 'tools', 'apks', 'brawlstars.apk');
const OUT = process.env.OUT_APK || path.join(ROOT, 'dist', 'ragnarstars-unsigned.apk');
const STAGE = process.env.STAGE_DIR || path.join(ROOT, 'build', 'stage');
const STORE = ['resources.arsc'];
const DROP_PREFIX = (process.env.DROP_PREFIX || '').split(',').filter(Boolean);

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const PY = String.raw`
import sys, os, zipfile
base, stage, out = sys.argv[1], sys.argv[2], sys.argv[3]
store = set(sys.argv[4].split(',')) if len(sys.argv) > 4 and sys.argv[4] else set()
drop = [p for p in (sys.argv[5].split(',') if len(sys.argv) > 5 and sys.argv[5] else []) if p]
z = zipfile.ZipFile(base)
stage_files = {}
for root, _, files in os.walk(stage):
    for f in files:
        p = os.path.join(root, f)
        rel = os.path.relpath(p, stage).replace(os.sep, '/')
        stage_files[rel] = p
seen = set()
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zo:
    for info in z.infolist():
        name = info.filename
        if any(name.startswith(d) for d in drop):
            continue
        seen.add(name)
        if name in stage_files:
            data = open(stage_files[name], 'rb').read()
        else:
            data = z.read(name)
        ct = zipfile.ZIP_STORED if name in store else zipfile.ZIP_DEFLATED
        ni = zipfile.ZipInfo(name, date_time=info.date_time)
        ni.external_attr = info.external_attr
        ni.compress_type = ct
        zo.writestr(ni, data)
    for rel in sorted(stage_files):
        if rel in seen:
            continue
        data = open(stage_files[rel], 'rb').read()
        ct = zipfile.ZIP_STORED if rel in store else zipfile.ZIP_DEFLATED
        zo.writestr(rel, data)
print('repacked:', out, os.path.getsize(out))
`;

fs.mkdirSync(path.join(ROOT, 'build'), { recursive: true });
const pyFile = path.join(ROOT, 'build', 'repack.py');
fs.writeFileSync(pyFile, PY);
execFileSync('python3', [pyFile, BASE, STAGE, OUT, STORE.join(','), DROP_PREFIX.join(',')], { stdio: 'inherit' });
console.log('OK ->', OUT);