/**
 * Integration tests — real TCP socket against an in-process game server.
 *
 * A disposable temp DB (DB_FILE before any require) and one live server on an
 * ephemeral port are booted in `before()`. The tests act as a small device:
 * they frame client payloads exactly like tools/test-login.js does, send them,
 * and assert on the outgoing frames parsed with src/tcp/framing.frames().
 *
 * Covers the login handshake (existing + brand-new account), keep-alive, the
 * rename flow (valid + rejected), and a turn command (select brawler) reaching
 * the DB.
 */

const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = path.join(os.tmpdir(), `bs-int-test-${process.pid}.db`);
process.env.DB_FILE = tmp;

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const config = require('../../config/default');
const { Writer } = require('../../src/byte-stream/writer');
const { frames } = require('../../src/tcp/framing');
const { PacketRouter } = require('../../src/tcp/router');
const { RoomRegistry } = require('../../src/tcp/rooms');
const { Server } = require('../../src/core/networking/server');
const { getRepo, resetRepo } = require('../../src/db/repo');
const { Helpers } = require('../../src/utils/helpers');
const { createSecurity } = require('../../src/middleware/security');

const LOGIN_ID = 10101;
const KEEP_ALIVE_ID = 10108;
const SET_NAME_ID = 10212;
const END_CLIENT_TURN_ID = 14102;

const LOBBY_INFO = 23457;
const LOGIN_OK = 20104;
const LOGIN_FAILED = 20103;
const OWN_HOME_DATA = 24101;
const FRIEND_LIST = 20105;
const KEEP_ALIVE_OK = 20108;
const AVAILABLE_SERVER_COMMAND = 24111;
const AVATAR_NAME_CHANGE_FAILED = 20205;

// Replay tools/test-login.js's payload layout: 8-byte account id, then the
// string/dword fields the gadget sends. Returns the full wire frame (id, len,
// payload) a device would hand the server.
function loginPayload(id, token) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64BE(BigInt(String(id).split('.')[0]));
  const tokenBuf = Buffer.from(String(token), 'utf-8');
  const tLen = Buffer.alloc(4);
  tLen.writeUInt32BE(tokenBuf.length, 0);
  const major = Buffer.alloc(4); major.writeUInt32BE(26, 0);
  const minor = Buffer.alloc(4); minor.writeUInt32BE(184, 0);
  const build = Buffer.alloc(4); build.writeUInt32BE(0, 0);
  const fp = Buffer.from('fingerprint', 'utf-8');
  const fpLen = Buffer.alloc(4); fpLen.writeUInt32BE(fp.length, 0);
  return Buffer.concat([idBuf, tLen, tokenBuf, major, minor, build, fpLen, fp]);
}

function clientFrame(id, payload) {
  const head = Buffer.alloc(7);
  head.writeUInt16BE(id, 0);
  head.writeUIntBE(payload.length, 2, 3);
  head.writeUInt16BE(0, 5);
  return Buffer.concat([head, payload]);
}

// Accumulate the server's raw writes; framing.frames() splits complete frames
// and we drop the consumed bytes so nothing double-counts.
function attach(socket) {
  socket.buf = Buffer.alloc(0);
  socket.frames = [];
  socket.on('data', (d) => {
    socket.buf = Buffer.concat([socket.buf, d]);
    const parsed = frames(socket.buf);
    let consumed = 0;
    for (const f of parsed) {
      socket.frames.push(f);
      consumed += 7 + f.packet_length;
    }
    socket.buf = socket.buf.subarray(consumed);
  });
}

function waitFor(socket, want, timeout = 4000) {
  const wanted = [...want];
  return new Promise((resolve, reject) => {
    const hasAll = () => {
      const ids = new Set(socket.frames.map((f) => f.packet_id));
      return wanted.every((id) => ids.has(id));
    };
    const iv = setInterval(() => {
      if (hasAll()) {
        clearInterval(iv);
        clearTimeout(to);
        resolve(socket.frames);
      }
    }, 20);
    const to = setTimeout(() => {
      clearInterval(iv);
      const ids = socket.frames.map((f) => f.packet_id);
      reject(new Error(`timeout waiting for ${JSON.stringify(wanted)}; got ${JSON.stringify(ids)}`));
    }, timeout);
  });
}

const silentLogger = { connection() {}, inbound() {}, unhandled() {} };
const silentErrors = { handle() {} };

let db;
let server;
let port;

before(async () => {
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
    try { fs.unlinkSync(f); } catch (e) { /* pass */ }
  }
  resetRepo();
  db = getRepo();

  const seededId = 1234567;
  db.create_player_account(seededId, 'it-seed-token');
  db.update_player_account('it-seed-token', 'Name', 'Guest');

  const security = createSecurity(config);
  const rooms = new RoomRegistry();
  const router = new PacketRouter({ db, rooms, logger: silentLogger, security });

  // Grab an ephemeral port before the server binds.
  port = await new Promise((resolve, reject) => {
    const p = net.createServer();
    p.once('error', reject);
    p.listen(0, '127.0.0.1', () => {
      const { port: picked } = p.address();
      p.close(() => resolve(picked));
    });
  });

  server = new Server(config, {
    db,
    rooms,
    logger: silentLogger,
    security,
    errorHandler: silentErrors,
    router,
    host: '127.0.0.1',
    port,
  });
  server.start();
  await new Promise((resolve) => server.server.once('listening', resolve));
});

after(async () => {
  Helpers.connected_clients = { ClientsCount: 0, Clients: {} };
  await new Promise((resolve) => {
    server.close();
    if (server.server.close) server.server.once('close', resolve);
    setTimeout(resolve, 500);
  });
  if (db) db.close();
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
    try { fs.unlinkSync(f); } catch (e) { /* pass */ }
  }
});

function roundtripFrame(id, payload) {
  return clientFrame(id, payload);
}

test('login handshake for an existing account returns LoginOk + HomeData + FriendList', async () => {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));
  attach(socket);

  socket.write(roundtripFrame(LOGIN_ID, loginPayload(1234567, 'it-seed-token')));

  const received = await waitFor(socket, [LOGIN_OK, OWN_HOME_DATA, FRIEND_LIST]);
  const ids = received.map((f) => f.packet_id);
  assert.ok(ids.includes(LOBBY_INFO), 'LobbyInfo always precedes');
  assert.ok(!ids.includes(LOGIN_FAILED), 'login should not fail');

  const player = db.load_player_account('it-seed-token');
  assert.ok(player, 'account still present');

  socket.destroy();
  await new Promise((resolve) => socket.once('close', resolve));
});

test('brand-new account (id 0) is created and logged in', async () => {
  const beforeCount = db.conn.prepare('SELECT COUNT(*) AS n FROM players').get().n;

  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));
  attach(socket);

  socket.write(roundtripFrame(LOGIN_ID, loginPayload(0, '')));

  const received = await waitFor(socket, [LOGIN_OK, OWN_HOME_DATA, FRIEND_LIST]);
  assert.ok(received.map((f) => f.packet_id).includes(LOBBY_INFO));

  const afterCount = db.conn.prepare('SELECT COUNT(*) AS n FROM players').get().n;
  assert.equal(afterCount, beforeCount + 1, 'new account must be persisted');

  const newest = db.load_all_players({}).sort((a, b) => b.ID - a.ID)[0];
  assert.equal(newest.Name, 'Guest', 'new account defaults to the Guest name');
  assert.notEqual(newest.Token, 'it-seed-token', 'new row got its own token');
  assert.ok(Helpers.connected_clients['Clients'][String(newest.ID)], 'new account is connected');

  socket.destroy();
  await new Promise((resolve) => socket.once('close', resolve));
});

test('keep-alive round-trips KeepAliveOk plus a fresh LobbyInfo', async () => {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));
  attach(socket);

  socket.write(roundtripFrame(LOGIN_ID, loginPayload(1234567, 'it-seed-token')));
  await waitFor(socket, [LOGIN_OK]);

  socket.write(roundtripFrame(KEEP_ALIVE_ID, Buffer.alloc(0)));
  const received = await waitFor(socket, [KEEP_ALIVE_OK]);
  const ids = received.map((f) => f.packet_id);
  assert.ok(ids.includes(LOBBY_INFO), 'keep-alive also refreshes LobbyInfo');

  socket.destroy();
  await new Promise((resolve) => socket.once('close', resolve));
});

test('rename persists a valid name and rejects an invalid one', async () => {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));
  attach(socket);

  socket.write(roundtripFrame(LOGIN_ID, loginPayload(1234567, 'it-seed-token')));
  await waitFor(socket, [LOGIN_OK]);

  const w = new Writer(null);
  w.writeString('RenamedOK');
  w.writeVInt(0);
  socket.write(roundtripFrame(SET_NAME_ID, w.getRaw()));
  const ok = await waitFor(socket, [AVAILABLE_SERVER_COMMAND]);
  assert.equal(db.load_player_account('it-seed-token').Name, 'RenamedOK');
  assert.equal(db.load_player_account('it-seed-token').NameSet, true);
  assert.equal(ok.filter((f) => f.packet_id === AVAILABLE_SERVER_COMMAND).length, 1);

  const bad = new Writer(null);
  bad.writeString('X');
  bad.writeVInt(0);
  socket.write(roundtripFrame(SET_NAME_ID, bad.getRaw()));
  await waitFor(socket, [AVATAR_NAME_CHANGE_FAILED]);
  assert.equal(db.load_player_account('it-seed-token').Name, 'RenamedOK', 'rejected name must not persist');

  socket.destroy();
  await new Promise((resolve) => socket.once('close', resolve));
});

test('a SelectCharacter turn command reaches the database', async () => {
  const socket = net.connect(port, '127.0.0.1');
  socket.on('error', () => {});
  await new Promise((resolve) => socket.once('connect', resolve));
  attach(socket);

  socket.write(roundtripFrame(LOGIN_ID, loginPayload(1234567, 'it-seed-token')));
  await waitFor(socket, [LOGIN_OK]);
  socket.frames.length = 0;

  const w = new Writer(null);
  w.writeVInt(0); // filtered
  w.writeVInt(42); // tick
  w.writeVInt(0); // checksum
  w.writeVInt(1); // one command
  w.writeVInt(525); // LogicSelectCharacterCommand
  w.writeVInt(0);
  w.writeVInt(0);
  w.writeLogicLong(0);
  w.writeDataReference(16, 1);
  socket.write(roundtripFrame(END_CLIENT_TURN_ID, w.getRaw()));

  // The command replies nothing itself, but every dispatch round-trips a
  // LobbyInfo — that's the ack the turn was processed.
  await waitFor(socket, [LOBBY_INFO]);
  const row = db.load_player_account('it-seed-token');
  assert.equal(row.HomeBrawler, 1);
  assert.equal(row.SelectedBrawler, 1);
  assert.equal(row.HomeSkin, 0);

  socket.destroy();
  await new Promise((resolve) => socket.once('close', resolve));
});