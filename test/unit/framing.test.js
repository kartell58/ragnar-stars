/**
 * Unit tests for src/tcp/framing.js — the 7-byte frame splitter.
 *
 * The layout under test is the one the gadget and the server agree on:
 *   id(2 BE) len(3 BE) payload(len)
 * frames() must return complete frames glued in a chunk and keep the tail for
 * the next chunk.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { HEADER_LEN, readHeader, frames } = require('../../src/tcp/framing');

function headerOf(id, len) {
  const h = Buffer.alloc(HEADER_LEN);
  h.writeUInt16BE(id, 0);
  h.writeUIntBE(len, 2, 3);
  return h;
}

test('HEADER_LEN is 7', () => {
  assert.equal(HEADER_LEN, 7);
});

test('readHeader parses id and payload length', () => {
  const buf = Buffer.concat([headerOf(10101, 16), Buffer.alloc(16, 0xab)]);
  const header = readHeader(buf, 0);
  assert.deepEqual(header, { packet_id: 10101, packet_length: 16 });
});

test('readHeader returns null on a partial header', () => {
  assert.equal(readHeader(Buffer.alloc(6), 0), null);
  assert.equal(readHeader(Buffer.alloc(0), 0), null);
});

test('frames splits a single frame and binds the payload', () => {
  const payload = Buffer.from('hello-please-help', 'utf-8');
  const chunk = Buffer.concat([headerOf(14102, payload.length), payload]);
  const out = frames(chunk);
  assert.equal(out.length, 1);
  assert.equal(out[0].packet_id, 14102);
  assert.equal(out[0].packet_length, payload.length);
  assert.equal(out[0].packet_data.toString('utf-8'), payload.toString('utf-8'));
});

test('frames splits several frames glued in one chunk', () => {
  const p1 = Buffer.from('aaa');
  const p2 = Buffer.from('bbbbbb');
  const p3 = Buffer.from('cc');
  const chunk = Buffer.concat([headerOf(10108, 3), p1, headerOf(10212, 6), p2, headerOf(14600, 2), p3]);
  const out = frames(chunk);
  assert.equal(out.length, 3);
  assert.deepEqual(
    out.map((f) => [f.packet_id, f.packet_data.toString()]),
    [[10108, 'aaa'], [10212, 'bbbbbb'], [14600, 'cc']],
  );
});

test('frames leaves a partial payload as trailing bytes', () => {
  const chunk = Buffer.concat([headerOf(24101, 100), Buffer.alloc(3)]);
  const out = frames(chunk);
  assert.equal(out.length, 0, 'a frame with an incomplete payload must not be returned');
});

test('frames leaves a partial header as trailing bytes', () => {
  const chunk = Buffer.concat([headerOf(20104, 1), Buffer.from([0x00]), Buffer.from([0xff, 0x01])]);
  const out = frames(chunk);
  assert.equal(out.length, 1);
  assert.equal(out[0].packet_id, 20104);
});

test('frames tolerates an empty chunk', () => {
  assert.deepEqual(frames(Buffer.alloc(0)), []);
});