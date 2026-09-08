#!/usr/bin/env python3
"""Renames the package + the same provider authorities that 5is2nu.apk renames.

Only the exact package string and the 5 provider authorities are renamed
(so the APK can coexist with the original Brawl Stars app). Class names
like `com.supercell.brawlstars.GameApp` and `cct.com.supercell.brawlstars`
are left untouched, because the dex still contains the original classes.
"""
import struct, sys, zipfile, tempfile, os

# Authorities renamed in 5is2nu.apk (pages from the string pool diff).
PROVIDER_SUFFIXES = [
    'FacebookInitProvider',
    'firebaseinitprovider',
    'helpshift.fileprovider',
    'lifecycle-trojan',
    'workmanager-init',
]

def patch_string_pool(data, old, new):
    u16 = lambda o: struct.unpack_from('<H', data, o)[0]
    u32 = lambda o: struct.unpack_from('<I', data, o)[0]

    assert u16(0) == 0x0003, hex(u16(0))
    man_size = u32(8)

    sp = None
    pos = 8
    while pos < man_size:
        typ = u16(pos)
        sz = u32(pos + 4)
        if typ == 0x0001:
            sp = pos
            break
        pos += sz
    assert sp is not None, 'string pool not found'

    count = u32(sp + 8)
    flags = u32(sp + 16)
    strs_start = u32(sp + 20)
    styles_start = u32(sp + 24)
    pool_size = u32(sp + 4)
    assert not (flags & 0x100), 'UTF-8 pool not supported'
    assert not (flags & 0x200) or styles_start == 0, 'styled string pool not supported'

    data_start = sp + strs_start
    offs = sp + 28

    def read_string(i):
        o = data_start + u32(offs + 4 * i)
        ln = u16(o)
        s = data[o + 2:o + 2 + 2 * ln].decode('utf-16le')
        return o + 2 + 2 * ln, ln, s

    def should_replace(s):
        if s == old:
            return True
        for suf in PROVIDER_SUFFIXES:
            if s == old + '.' + suf:
                return True
        return False

    replace_map = {}
    for i in range(count):
        _, _, s = read_string(i)
        if not should_replace(s):
            continue
        if s == old:
            news = new
        else:
            news = new + s[len(old):]
        replace_map[i] = struct.pack('<H', len(news)) + news.encode('utf-16le')
    assert any(read_string(i)[2] == old for i in range(count)), \
        f'string {old!r} not found in pool'

    delta = 2 * (len(old)) - 2 * (len(new))
    assert delta != 0, 'package and new name have the same length; nothing to shift'

    old_offsets = [u32(offs + 4 * i) for i in range(count)]
    shifted = 0
    new_offsets = []
    for i, off in enumerate(old_offsets):
        new_offsets.append(off - delta * shifted)
        if i in replace_map:
            shifted += 1
    old_data_len = (sp + styles_start - data_start) if styles_start else (sp + pool_size - data_start)
    for i, off in enumerate(new_offsets):
        struct.pack_into('<I', data, offs + 4 * i, off)

    out = bytearray()
    for i in range(count):
        if i in replace_map:
            enc = replace_map[i]
        else:
            o = data_start + old_offsets[i]
            ln = u16(o)
            enc = bytes(data[o:o + 2 + 2 * ln])
        out += enc
        want = new_offsets[i + 1] if i < count - 1 else (old_data_len - delta * len(replace_map))
        have = len(out)
        assert have <= want, (i, have, want)
        out += b'\x00' * (want - have)

    del data[data_start:data_start + old_data_len]
    data[data_start:data_start] = out
    shrink = old_data_len - len(out)
    struct.pack_into('<I', data, sp + 4, pool_size - shrink)
    if styles_start != 0:
        struct.pack_into('<I', data, sp + 24, styles_start - shrink)
    return shrink

def main():
    apk, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
    zin = zipfile.ZipFile(apk)
    data = bytearray(zin.read('AndroidManifest.xml'))
    delta = patch_string_pool(data, old, new)
    struct.pack_into('<I', data, 4, struct.unpack_from('<I', data, 4)[0] - delta)

    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(apk), suffix='.apk')
    os.close(fd)
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zo, zipfile.ZipFile(apk) as zi:
        for info in zi.infolist():
            content = bytes(data) if info.filename == 'AndroidManifest.xml' else zi.read(info.filename)
            ct = zipfile.ZIP_STORED if info.filename == 'resources.arsc' else zipfile.ZIP_DEFLATED
            ni = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            ni.external_attr = info.external_attr
            ni.compress_type = ct
            zo.writestr(ni, content)
    os.replace(tmp, apk)
    print(f'package {old} -> {new} (delta {delta} bytes) in {apk}')

if __name__ == '__main__':
    main()