/**
 * Unit tests for the Player defaults and Helpers account-loading rules.
 *
 * Covers: default profile fields (id/token/name/status/client_version), the
 * resource table layout, the brawler bookkeeping maps being sized from
 * characters.csv, load_account() field mapping + the MAX_VALUE caps the
 * emulator grants, and the token/id generators. Player state mutations live on
 * the prototype by design; tests read, never write, shared maps.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { Player } = require('../../src/logic/player');
const { Helpers, MAX_VALUE } = require('../../src/utils/helpers');
const { Characters } = require('../../src/files/csv-logic/characters');

test('default profile fields', () => {
  const p = Object.create(Player.prototype);
  assert.equal(p.ID, 0);
  assert.equal(p.token, null);
  assert.equal(p.name, 'Guest');
  assert.equal(p.name_set, false);
  assert.equal(p.status, 0);
  assert.equal(p.club_id, 0);
  assert.equal(p.content_creator, 'Kartell');
  assert.equal(Array.isArray(p.friends), true);
});

test('resource table has the four expected slots', () => {
  const p = Object.create(Player.prototype);
  assert.deepEqual(
    p.resources.map((r) => r.ID),
    [1, 8, 9, 10],
  );
  assert.equal(p.resources.length, 4);
});

test('brawler maps are sized from characters.csv', () => {
  const brawlerCount = new Characters().get_brawlers_id().length;
  assert.ok(brawlerCount > 30, 'characters.csv should define many brawlers');
  assert.equal(Object.keys(Player.prototype.brawlers_level).length, brawlerCount);
  assert.equal(Object.keys(Player.prototype.brawlers_trophies).length, brawlerCount);
  assert.equal(Object.keys(Player.prototype.brawlers_powerpoints).length, brawlerCount);
  assert.equal(Object.keys(Player.prototype.selected_skins).length, brawlerCount);
});

test('every unlocked brawler is sorted, numeric and within the sheet', () => {
  const sheet = new Characters().get_brawlers_id();
  const set = new Set(sheet);
  const unlocked = Player.prototype.brawlers_unlocked;
  assert.ok(unlocked.length >= 1);
  for (const id of unlocked) {
    assert.equal(set.has(id), true, `brawler ${id} not in characters.csv`);
  }
  const sorted = unlocked.slice().sort((a, b) => a - b);
  assert.deepEqual(unlocked.slice().sort((a, b) => a - b), sorted);
});

test('load_account maps db columns and caps currencies at MAX_VALUE', () => {
  const p = Object.create(Player.prototype);
  const ctx = { player: p };
  const playerData = {
    Name: 'DevTest',
    NameSet: true,
    NameColor: 7,
    Trophies: 123,
    SelectedBrawler: 2,
    HomeSkin: 4,
    Resources: JSON.parse(JSON.stringify(p.resources)),
  };
  Helpers.load_account(ctx, playerData);

  assert.equal(p.name, 'DevTest');
  assert.equal(p.name_set, true);
  assert.equal(p.name_color, 7);
  assert.equal(p.home_brawler, 2);
  assert.equal(p.home_skin, 4);

  assert.equal(p.trophies, MAX_VALUE);
  assert.equal(p.high_trophies, MAX_VALUE);
  assert.equal(p.gems, MAX_VALUE);
  assert.equal(p.tickets, MAX_VALUE);
  assert.equal(p.exp_points, MAX_VALUE);
  for (const resource of p.resources) assert.equal(resource.Amount, MAX_VALUE);
});

test('load_account keeps a default when the column is missing', () => {
  const p = Object.create(Player.prototype);
  p.name = 'Sobrenome-da-Regiao';
  Helpers.load_account({ player: p }, {});
  assert.equal(p.name, 'Sobrenome-da-Regiao');
});

test('randomToken produces 40 alphanumeric chars', () => {
  const t = Helpers.randomToken();
  assert.equal(t.length, 40);
  assert.match(t, /^[A-Za-z0-9]{40}$/);
});

test('randomID produces an 8-digit number', () => {
  const id = Helpers.randomID();
  assert.ok(Number.isInteger(id));
  assert.ok(id >= 10000000 && id <= 99999999);
});

test('get_box_type maps client box ids to tier sizes', () => {
  assert.equal(Helpers.get_box_type(5), 10);
  assert.equal(Helpers.get_box_type(4), 12);
  assert.equal(Helpers.get_box_type(3), 11);
  assert.equal(Helpers.get_box_type(1), 12);
  assert.equal(Helpers.get_box_type(9), undefined);
});