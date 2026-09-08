function toSigned(bytes) {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  const bits = bytes.length * 8;
  if ((bytes[0] & 0x80) !== 0) v -= 1n << BigInt(bits);
  return Number(v);
}

function toUnsigned(bytes) {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return Number(v);
}

class Reader {
  constructor(initialBytes, endian = 'big') {
    this.buffer = Buffer.from(initialBytes);
    this.endian = endian;
    this.i = 0;
  }

  read(length) {
    const out = this.buffer.subarray(this.i, this.i + length);
    this.i += length;
    return out;
  }

  readByte() {
    return this.read(1)[0];
  }

  readVInt() {
    const n = this._readVarint(true);
    return Number((n >> 1n) ^ -(n & 1n));
  }

  readIntList() {
    const intList = [];
    const length = this.readVInt();
    for (let x = 0; x < length; x++) intList.push(this.readVInt());
    return intList;
  }

  readShort(length = 2) {
    return toUnsigned(this.read(length));
  }

  readInt(length = 4) {
    return toUnsigned(this.read(length));
  }

  readLong() {
    return this.readInt(8);
  }

  readUInt8() {
    return this.readUInteger();
  }

  readUInteger(length = 1) {
    let result = 0;
    for (let x = 0; x < length; x++) {
      const byte = this.buffer[this.i];
      let bitPadding = x * 8;
      if (this.endian === 'big') bitPadding = 8 * (length - 1) - bitPadding;
      result |= byte << bitPadding;
      this.i += 1;
    }
    return result;
  }

  _readVarint(rotate = true) {
    let result = 0n;
    let shift = 0n;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let byte = this.readByte();
      if (rotate && shift === 0n) {
        const seventh = (byte & 0x40) >> 6;
        const msb = (byte & 0x80) >> 7;
        let n = byte << 1;
        n = n & ~0x181;
        byte = n | (msb << 7) | seventh;
      }
      result |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
      if (!(byte & 0x80)) break;
    }
    return result;
  }

  readBool() {
    return this.readUInt8() >= 1;
  }

  readDataReference() {
    const a = this.readVInt();
    if (a > 0) {
      const b = this.readVInt();
      return [a, b];
    }
    return [a, 0];
  }

  readString() {
    const length = this.readInt();
    if (length === 4294967295) return '';
    try {
      const decoded = this.buffer.subarray(this.i, this.i + length);
      this.i += length;
      return decoded.toString('utf-8');
    } catch (e) {
      throw new RangeError('String length too high/out of range!');
    }
  }

  peekInt(length = 4) {
    return toUnsigned(this.buffer.subarray(this.i, this.i + length));
  }

  readLogicLong() {
    const x = this.readVInt();
    const y = this.readVInt();
    return [x, y];
  }
}

module.exports = { Reader, toSigned, toUnsigned };