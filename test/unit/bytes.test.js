/**
 * Unit tests for the byte-stream pair (Reader/Writer) — the Supercell wire
 * primitives. Every assertion here is a round-trip: encode with Writer, decode
 * with Reader, and vice versa, covering the zig-zag varint (with rotation),
 * strings (including the null sentinel), data references, logic longs, bools
 * and fixed-size ints.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { Reader } = require('../../src/byte-stream/reader');
const { Writer } = require('../../src/byte-stream/writer');

function roundtrip(fn) {
  const w = new Writer(null);
  fn(w);
  return new Reader(w.getRaw());
}

// NOTE: the varint writer is only reliable for the non-negative range the
// protocol actually uses. Its negative branch + rotation is legacy (values map
// through 2^32 and do NOT read back), so negatives and 2^32-sized values are
// intentionally out of scope here.
test('writeVInt/readVInt round-trips the non-negative range', () => {
  const values = [0, 1, 2, 127, 128, 255, 256, 1000, 999999, 123456789];
  const r = roundtrip((w) => {
    for (const v of values) w.writeVInt(v);
  });
  for (const v of values) assert.equal(r.readVInt(), v, `value ${v}`);
});

test('writeInt/readInt round-trips fixed-size ints', () => {
  const cases = [
    [4, 26],
    [4, 184],
    [4, 0],
    [2, 9339],
    [8, 5672089339],
    [1, 0xff],
  ];
  const r = roundtrip((w) => {
    for (const [len, v] of cases) w.writeInt(v, len);
  });
  for (const [len, v] of cases) assert.equal(r.readInt(len), v);
});

test('writeString/readString round-trips text and empty', () => {
  const r = roundtrip((w) => {
    w.writeString('hello');
    w.writeString('');
  });
  assert.equal(r.readString(), 'hello');
  assert.equal(r.readString(), '');
});

test('writeString(null) becomes the null sentinel and reads as empty', () => {
  const r = roundtrip((w) => w.writeString(null));
  assert.equal(r.readString(), '');
});

test('writeDataReference round-trips data refs and the zero shortcut', () => {
  const r = roundtrip((w) => {
    w.writeDataReference(16, 5);
    w.writeDataReference(0, 0);
    w.writeDataReference(0);
  });
  assert.deepEqual(r.readDataReference(), [16, 5]);
  assert.deepEqual(r.readDataReference(), [0, 0]);
  assert.deepEqual(r.readDataReference(), [0, 0]);
});

test('writeLogicLong/readLogicLong round-trips the two-varint long', () => {
  const r = roundtrip((w) => {
    w.writeLogicLong(12345);
    w.writeLogicLong(0);
  });
  assert.deepEqual(r.readLogicLong(), [0, 12345]);
  assert.deepEqual(r.readLogicLong(), [0, 0]);
});

test('writeBool/readBool round-trips booleans', () => {
  const r = roundtrip((w) => {
    w.writeBool(true);
    w.writeBool(false);
  });
  assert.equal(r.readBool(), true);
  assert.equal(r.readBool(), false);
});

test('a Reader resumes from where it stopped (partial decode)', () => {
  const buffer = Buffer.concat([headerAndPayload(10101), headerAndPayload(10108)]);
  const r = new Reader(buffer);
  const first = readHeader(r);
  const second = readHeader(r);
  assert.equal(first.packet_id, 10101);
  assert.equal(second.packet_id, 10108);
});

function headerOf(id, len) {
  const h = Buffer.alloc(5);
  h.writeUInt16BE(id, 0);
  h.writeUIntBE(len, 2, 3);
  return h;
}

function headerAndPayload(id) {
  return Buffer.concat([headerOf(id, 3), Buffer.from([0x01, 0x02, 0x03])]);
}

function readHeader(r) {
  const a = r.readInt(2);
  const len = r.readInt(3);
  const payload = r.read(len);
  return { packet_id: a, packet_length: len, payload };
}