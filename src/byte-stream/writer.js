/**
 * Outbound wire serializer — every server->client response is encoded through
 * this buffer writer. Server messages (src/protocol/messages/server) subclass
 * / use it; the packed layout per frame is:
 *
 *     id(2)  payloadLen(3)  version(2)  payload...  trailer(7)
 *
 * where the trailer is the fixed 0xFF 0xFF 0x00 0x00 0x00 0x00 0x00 terminator
 * the client expects to close a message. writeVInt() is the Supercell varint
 * (zig-zag with a rotation trick), and writeDataReference() the (id, value)
 * pair used for skins/brawlers. send() pushes to the socket; sendByID() pushes
 * to ANOTHER connected client (server-initiated pushes to a specific player).
 */

const zlib = require('node:zlib');
const { Helpers } = require('../utils/helpers');
const { log } = require('../utils/logger');

const TRAILER = Buffer.from([0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x00]);

function toSignedBytes(data, length) {
  let n = BigInt(data);
  const out = Buffer.alloc(length);
  for (let i = length - 1; i >= 0; i--) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

class Writer {
  constructor(client, endian = 'big') {
    this.client = client;
    this.endian = endian;
    this.buffer = Buffer.alloc(0);
  }

  append(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  writeInt(data, length = 4) {
    this.append(toSignedBytes(data, length));
  }

  writeUInteger(integer, length = 1) {
    this.append(toSignedBytes(integer, length));
  }

  writeLong(data) {
    this.writeInt(data, 8);
  }

  writeLogicLong(data) {
    this.writeVInt(0);
    this.writeVInt(data);
  }

  writeArrayVint(data) {
    this.writeVInt(data.length);
    for (const x of data) this.writeVInt(x);
  }

  writeUInt8(integer) {
    this.writeUInteger(integer);
  }

  writeInt8(integer) {
    this.writeInt(integer, 1);
  }

  writeInt16(data) {
    this.writeInt(data, 2);
  }

  writeBool(boolean) {
    this.writeUInt8(boolean ? 1 : 0);
  }

  writeBooleanTest(...args) {
    let boolean = 0;
    let i = 0;
    for (const value of args) {
      if (value) boolean |= 1 << i;
      i++;
    }
    this.writeByte(boolean);
  }

  writeHexa(data) {
    if (data) {
      if (data.startsWith('0x')) data = data.slice(2);
      const hex = data.replace(/\s+/g, '').replace(/-/g, '');
      this.append(Buffer.from(hex, 'hex'));
    }
  }

  _header(packet) {
    let out = toSignedBytes(this.id, 2);
    out = Buffer.concat([out, toSignedBytes(packet.length, 3)]);
    if (this.version !== undefined) {
      out = Buffer.concat([out, toSignedBytes(this.version, 2)]);
    } else {
      out = Buffer.concat([out, toSignedBytes(0, 2)]);
    }
    return out;
  }

  send() {
    this.encode();
    const packet = this.buffer;
    this.buffer = Buffer.concat([this._header(packet), packet, TRAILER]);
    this.client.send(this.buffer);
    log(
      `${Helpers.yellow}[SERVER] PacketID: ${this.id}, Name: ${this.constructor.name}, Length: ${this.buffer.length}`,
    );
  }

  sendByID(ID) {
    this.encode();
    const packet = this.buffer;
    this.buffer = Buffer.concat([this._header(packet), packet, TRAILER]);
    const entry = Helpers.connected_clients['Clients'][String(ID)];
    entry['SocketInfo'].send(this.buffer);
  }

  writeVInt(data, rotate = true) {
    if (data === 0) {
      this.writeByte(0);
    } else if (data < 0) {
      this.writeVInt(4294967296 + data);
    } else {
      let d = BigInt(data);
      d = (d << 1n) ^ (d >> 31n);
      const bytes = [];
      while (d) {
        let b = d & 0x7fn;
        if (d >= 0x80n) b |= 0x80n;
        if (rotate) {
          rotate = false;
          const lsb = b & 0x1n;
          const msb = (b & 0x80n) >> 7n;
          b >>= 1n;
          b = b & ~0xc0n;
          b = b | (msb << 7n) | (lsb << 6n);
        }
        bytes.push(Number(b));
        d >>= 7n;
      }
      this.append(Buffer.from(bytes));
    }
  }

  writeDataReference(x, y = 0) {
    if (x !== 0) {
      this.writeVInt(x);
      this.writeVInt(y);
    } else {
      this.writeVInt(0);
    }
  }

  writeString(string = null) {
    if (string === null || string === undefined) {
      this.writeInt(-1);
    } else {
      const encoded = Buffer.from(String(string), 'utf-8');
      this.writeInt(encoded.length);
      this.append(encoded);
    }
  }

  writeCompressedString(string) {
    const compressed = zlib.deflateSync(Buffer.from(String(string), 'utf-8'));
    this.writeInt(compressed.length + 4);
    const lenBytes = Buffer.alloc(4);
    lenBytes.writeUInt32LE(Buffer.byteLength(String(string), 'utf-8'));
    this.append(lenBytes);
    this.append(compressed);
  }

  writeStringShort(string = null) {
    if (string === null || string === undefined) {
      this.writeInt(-1);
    } else {
      const encoded = Buffer.from(String(string), 'utf-8');
      this.writeInt8(encoded.length);
      this.append(encoded);
    }
  }

  writeStringReference(string = null) {
    const encoded = Buffer.from(String(string), 'utf-8');
    this.writeInt16(0);
    this.writeVInt(encoded.length);
    this.append(encoded);
  }

  writeByte(data) {
    this.writeInt(data, 1);
  }

  writeNullVInt() {
    this.writeVInt(-1);
  }

  size() {
    return this.buffer.length;
  }

  getRaw() {
    return this.buffer;
  }

  writeBytes(data) {
    this.append(data);
  }
}

Writer.prototype.writeBoolean = Writer.prototype.writeBool;
Writer.prototype.writeInt32 = Writer.prototype.writeInt;

module.exports = { Writer, toSignedBytes };