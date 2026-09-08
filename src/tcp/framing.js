/**
 * TCP frame splitting for the Brawl Stars protocol.
 *
 * Every wire frame is a 7-byte header followed by the payload:
 *
 *     id(2 BE)  len(3 BE)  payload(len)
 *
 * The packet id is the same 4-digit protocol id registered in the message
 * factory (src/protocol/logicLaserMessageFactory.js); `len` is a 24-bit
 * big-endian count of the PAYLOAD bytes only, so a frame is exactly 7 + len
 * bytes. A chunk usually arrives with one or more frames glued together (and
 * sometimes a partial tail); frames() splits the complete ones and leaves the
 * rest for the next chunk.
 *
 * The device gadget kitchen-tables the same layout
 * (tools/gadget/krtl-gadget.js, Buffer helpers: msgtype at 0..1, payload
 * length at 2..4), so a header written here is exactly what the modded client
 * peeks to demultiplex LoginOk/KeepAliveOk/etc.
 */

const HEADER_LEN = 7;

/**
 * Parse just the header at `offset`. Returns null when fewer than 7 bytes are
 * left (partial header — wait for the next chunk).
 * @returns {{packet_id:number, packet_length:number}|null}
 */
function readHeader(data, offset) {
  if (offset + HEADER_LEN > data.length) return null;
  return {
    packet_id: data.readUInt16BE(offset),
    packet_length: data.readUIntBE(offset + 2, 3),
  };
}

/**
 * Split `data` into complete frames. Stops at the first incomplete header or
 * payload; trailing bytes are returned for the caller to buffer up.
 * @returns {Array<{packet_id:number, packet_length:number, packet_data:Buffer}>}
 */
function frames(data) {
  const out = [];
  let offset = 0;
  while (offset + HEADER_LEN <= data.length) {
    const header = readHeader(data, offset);
    if (offset + HEADER_LEN + header.packet_length > data.length) break;
    out.push({
      packet_id: header.packet_id,
      packet_length: header.packet_length,
      packet_data: data.subarray(offset + HEADER_LEN, offset + HEADER_LEN + header.packet_length),
    });
    offset += HEADER_LEN + header.packet_length;
  }
  return out;
}

module.exports = { HEADER_LEN, readHeader, frames };