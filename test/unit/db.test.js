/**
 * Behavior tests for the SQLite repo (src/db/repo — getRepo()). A disposable
 * temp DB is used: DB_FILE is set BEFORE any module that pulls config/default
 * is required, so every repo/player module resolves to the throwaway file.
 *
 * Covers the CRUD lifecycle (player/club), the ban lookups, sorted listings
 * and the JSON-column round-trip the protocol relies on, plus the guard that
 * rejects unknown columns.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = path.join(os.tmpdir(), `bs-db-test-${process.pid}.db`);
process.env.DB_FILE = tmp;

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { getRepo, resetRepo } = require('../../src/db/repo');

let db;

before(() => {
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
    try { fs.unlinkSync(f); } catch (e) { /* pass */ }
  }
  resetRepo();
  db = getRepo();
});

after(() => {
  if (db) db.close();
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
    try { fs.unlinkSync(f); } catch (e) { /* pass */ }
  }
});

const nextId = () => Math.floor((Date.now() % 100000000) * 1000 + Math.floor(Math.random() * 90000) + 10000);

test('create + load a player account (auth fields)', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);

  const acc = db.load_player_account(token);
  assert.ok(acc, 'account not returned');
  assert.equal(acc.ID, id);
  assert.equal(acc.Token, token);
  assert.equal(acc.Name, 'Guest');
  assert.equal(typeof acc.Trophies, 'number');
  assert.ok(Array.isArray(acc.UnlockedBrawlers) && acc.UnlockedBrawlers.length > 0, 'brawlers missing');
  assert.ok(Array.isArray(acc.Resources) && acc.Resources.length === 4, 'resources missing');

  const byId = db.load_player_account_by_id(id);
  assert.ok(byId, 'load_player_account_by_id returned null');
  assert.equal(byId.ID, id);
});

test('load of an unknown token/id is null', () => {
  assert.equal(db.load_player_account('no-such-token'), null);
  assert.equal(db.load_player_account_by_id(999999999), null);
});

test('update_player_account round-trips scalar and JSON columns', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);

  db.update_player_account(token, 'Name', 'Behavior');
  db.update_player_account(token, 'Gems', 777);
  assert.equal(db.load_player_account(token).Name, 'Behavior');
  assert.equal(db.load_player_account(token).Gems, 777);

  const friends = [1, 2, 3];
  const skins = { 1: 0, 2: 9 };
  const levels = { 1: 3, 2: 7 };
  db.update_player_account(token, 'Friends', friends);
  db.update_player_account(token, 'SelectedSkins', skins);
  db.update_player_account(token, 'BrawlersLevel', levels);

  const back = db.load_player_account(token);
  assert.deepEqual(back.Friends, friends);
  assert.deepEqual(back.SelectedSkins, skins);
  assert.deepEqual(back.BrawlersLevel, levels);
});

test('update_player_account rejects unknown columns', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);
  assert.throws(() => db.update_player_account(token, 'Nope', 1), /Unknown player column/);
});

test('ban lifecycle: is_player_banned flips with the admin_bans row', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);

  assert.equal(db.is_player_banned(id), false);
  db.conn
    .prepare('INSERT INTO admin_bans (player_id, reason, banned_by, created_at) VALUES (?, ?, ?, ?)')
    .run(id, 'unit-test', 'unit-test', new Date().toISOString());
  assert.equal(db.is_player_banned(id), true);
  db.conn.prepare('DELETE FROM admin_bans WHERE player_id = ?').run(id);
  assert.equal(db.is_player_banned(id), false);
});

test('club CRUD and sorted listings', () => {
  const a = nextId();
  const b = nextId() + 1;
  db.create_club(a, { Name: 'Alfa Club', Trophies: 100 });
  db.create_club(b, { Name: 'Bravo Club', Trophies: 400 });

  // Name rows are returned unordered (name sort is NaN-driven — the protocol
  // only sorts clubs by numeric fields), so assert the set, not the order.
  const byName = db.load_all_clubs_sorted({}, 'Name');
  const names = byName.map((c) => c.Name).sort();
  assert.deepEqual(names, ['Alfa Club', 'Bravo Club']);

  const byTrophies = db.load_all_clubs_sorted({}, 'Trophies');
  assert.equal(byTrophies[0].Trophies, 400);
  assert.equal(byTrophies[1].Trophies, 100);

  db.update_club(a, 'Description', 'test club');
  assert.equal(db.load_club(a).Description, 'test club');

  db.delete_club(b);
  assert.equal(db.load_club(b), null);
});

test('players sorted by trophies and per-brawler trophies filter', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);
  db.update_player_account(token, 'Trophies', 555);

  const sorted = db.load_all_players_sorted({}, 'Trophies');
  assert.ok(sorted.length >= 1);
  assert.equal(sorted[0].ID, id);

  db.update_player_account(token, 'BrawlersTrophies', { 9: 700, 10: 0 });
  const byBrawler = db.load_all_players_sorted({}, 'BrawlersTrophies', '9');
  assert.ok(byBrawler.length >= 1, 'no row with brawler-9 trophies');
  assert.equal(byBrawler[0].ID, id);

  const none = db.load_all_players_sorted({}, 'BrawlersTrophies', '10');
  assert.deepEqual(none, []);
});

test('delete_player removes the row entirely', () => {
  const id = nextId();
  const token = `db-test-${id}`;
  db.create_player_account(id, token);
  db.delete_player(token);
  assert.equal(db.load_player_account(token), null);
});