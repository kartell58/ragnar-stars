/**
 * Headless login smoke — a tiny fake client that connects to the running
 * server and replays the 10101 Login payload for an existing account name
 * (`node tools/test-login.js <Name>`, port override via $TPORT), printing the
 * incoming packet ids as proof the handshake completes. Purely a dev tool.
 */

const net = require('node:net');
const path = require('node:path');
const { SQLiteDatabase } = require(path.resolve(__dirname, '..', 'src', 'db', 'sqliteDatabase'));

const db = new SQLiteDatabase('data/accounts.db');

function pick(name) {
  const found = db.conn.prepare('SELECT ID, Token FROM players WHERE Name = ?').get(name);
  if (found) return found;
  return { ID: 1234567890, Token: 'token-nonexistent-xyz' };
}

function sendLogin(socket, acc) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64BE(BigInt(String(acc.ID).split('.')[0]));
  const token = Buffer.from(String(acc.Token), 'utf-8');
  const tLen = Buffer.alloc(4);
  tLen.writeUInt32BE(token.length, 0);
  const major = Buffer.alloc(4); major.writeUInt32BE(26, 0);
  const minor = Buffer.alloc(4); minor.writeUInt32BE(184, 0);
  const build = Buffer.alloc(4); build.writeUInt32BE(0, 0);
  const fp = Buffer.from('fingerprint', 'utf-8');
  const fpLen = Buffer.alloc(4); fpLen.writeUInt32BE(fp.length, 0);

  const payload = Buffer.concat([idBuf, tLen, token, major, minor, build, fpLen, fp]);
  const head = Buffer.alloc(7);
  head.writeUInt16BE(10101, 0);
  head.writeUIntBE(payload.length, 2, 3);
  head.writeUInt16BE(2, 5);
  return Buffer.concat([head, payload]);
}

const port = Number(process.env.TPORT || 9339);
const socket = new net.Socket();
socket.on('data', (d) => {
  let off = 0;
  while (off + 7 <= d.length) {
    const id = d.readUInt16BE(off);
    const len = d.readUIntBE(off + 2, 3);
    console.log('[recv] id=' + id + ' len=' + len);
    off += 7 + len;
  }
});
socket.on('close', () => { console.log('closed'); process.exit(0); });
socket.on('error', (e) => { console.log('error: ' + e.code); process.exit(1); });
socket.connect(port, '127.0.0.1', () => {
  const acc = pick(process.argv[2]);
  console.log('login Name=' + process.argv[2] + ' ID=' + String(acc.ID).split('.')[0] + ' token=' + String(acc.Token).slice(0, 12));
  socket.write(sendLogin(socket, acc));
});
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 6000);