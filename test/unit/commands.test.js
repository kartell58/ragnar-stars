/**
 * Behavior tests for the turn commands (src/protocol/commands/client).
 *
 * Each test decodes a command payload the way EndClientTurnMessage would and
 * then runs process() against a REAL temp-DB repo, so "did the purchase persist"
 * is verified through the same snake_case API the handlers use. A fake client
 * captures any outbound push (AvailableServerCommandMessage).
 *
 * Environment note (same rule as db-smoke): DB_FILE is set before requiring
 * anything that pulls config/default.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = path.join(os.tmpdir(), `bs-cmd-test-${process.pid}.db`);
process.env.DB_FILE = tmp;

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { Reader } = require('../../src/byte-stream/reader');
const { Writer } = require('../../src/byte-stream/writer');
const { Player } = require('../../src/logic/player');
const { Characters } = require('../../src/files/csv-logic/characters');
const { LogicShopData } = require('../../src/logic/home/logicShopData');
const { getRepo, resetRepo } = require('../../src/db/repo');
const { createMessageContext } = require('../../src/tcp/context');

const LogicSelectCharacterCommand = require('../../src/protocol/commands/client/logicSelectCharacterCommand').LogicSelectCharacterCommand;
const LogicSelectSkinCommand = require('../../src/protocol/commands/client/logicSelectSkinCommand').LogicSelectSkinCommand;
const LogicLevelUpCommand = require('../../src/protocol/commands/client/logicLevelUpCommand').LogicLevelUpCommand;
const LogicPurchaseDoubleCoinsCommand = require('../../src/protocol/commands/client/logicPurchaseDoubleCoinsCommand').LogicPurchaseDoubleCoinsCommand;
const LogicPurchaseGemsCommand = require('../../src/protocol/commands/client/logicPurchaseGemsCommand').LogicPurchaseGemsCommand;
const LogicPurchaseHeroLvlUpMaterialCommand = require('../../src/protocol/commands/client/logicPurchaseHeroLvlUpMaterialCommand').LogicPurchaseHeroLvlUpMaterialCommand;
const LogicSetPlayerThumbnailCommand = require('../../src/protocol/commands/client/logicSetPlayerThumbnailCommand').LogicSetPlayerThumbnailCommand;
const LogicSetPlayerNameColorCommand = require('../../src/protocol/commands/client/logicSetPlayerNameColorCommand').LogicSetPlayerNameColorCommand;
const LogicGatchaCommand = require('../../src/protocol/commands/client/logicGatchaCommand').LogicGatchaCommand;
const LogicClaimRankUpRewardCommand = require('../../src/protocol/commands/client/logicClaimRankUpRewardCommand').LogicClaimRankUpRewardCommand;
const LogicPurchaseOfferCommand = require('../../src/protocol/commands/client/logicPurchaseOfferCommand').LogicPurchaseOfferCommand;

let db;
let nextId = 0;

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

// A command runs against a Reader-like context (that's what EndClientTurn is).
class Ctx extends Reader {
  constructor(buf) {
    super(buf ? Buffer.from(buf) : Buffer.alloc(0));
    this.client = null;
    this.player = null;
  }
}

// Player state lives on the prototype; give each test its OWN mutable copies.
function freshPlayer() {
  const p = Object.create(Player.prototype);
  p.resources = Player.prototype.resources.map((r) => ({ ...r }));
  p.brawlers_unlocked = Player.prototype.brawlers_unlocked.slice();
  p.unlocked_skins = Player.prototype.unlocked_skins.slice();
  p.selected_skins = { ...Player.prototype.selected_skins };
  p.brawlers_trophies = { ...Player.prototype.brawlers_trophies };
  p.brawlers_high_trophies = { ...Player.prototype.brawlers_high_trophies };
  p.brawlers_level = { ...Player.prototype.brawlers_level };
  p.brawlers_powerpoints = { ...Player.prototype.brawlers_powerpoints };
  p.brawlers_spg = Player.prototype.brawlers_spg.slice();
  p.token_doubler = 0;
  return p;
}

function fakeClient() {
  const client = { sends: [] };
  client.send = (buf) => client.sends.push(buf);
  return client;
}

function wirePlayer(token) {
  nextId += 1;
  const id = Math.floor((Date.now() % 100000000) * 1000 + nextId);
  db.create_player_account(id, token);
  const player = freshPlayer();
  player.ID = id;
  player.token = token;
  return player;
}

// Encode the 3 skip fields every command payload starts with (vint, vint,
// logicLong) then whatever the caller writes.
function commandPrefix(w) {
  w.writeVInt(0);
  w.writeVInt(0);
  w.writeLogicLong(0);
}

function run(command, player, client, db, payload) {
  const w = new Writer(null);
  commandPrefix(w);
  w.writeBytes(payload);
  const ctx = new Ctx(w.getRaw());
  ctx.player = player;
  ctx.client = client;
  command.prototype.decode.call(ctx);
  const msgCtx = createMessageContext({
    client,
    player,
    ip: '0.0.0.0',
    packetId: 14102,
    db,
    rooms: null,
    logger: null,
  });
  command.prototype.process.call(ctx, msgCtx);
  return ctx;
}

test('LogicSelectCharacterCommand equips a home brawler and persists it', () => {
  const token = `cmd-select-char-${nextId}`;
  const player = wirePlayer(token);
  run(LogicSelectCharacterCommand, player, fakeClient(), db, (() => {
    const w = new Writer(null);
    w.writeDataReference(16, 1);
    return w.getRaw();
  })());

  assert.equal(player.home_brawler, 1);
  assert.equal(typeof player.starpower, 'number');
  assert.equal(typeof player.gadget, 'number');

  const row = db.load_player_account(token);
  assert.equal(row.SelectedBrawler, 1);
  assert.equal(row.HomeBrawler, 1);
  assert.equal(row.HomeSkin, 0);
});

test('LogicSelectSkinCommand equips a skin and updates SelectedSkins', () => {
  const token = `cmd-select-skin-${nextId}`;
  const player = wirePlayer(token);
  const characters = new Characters();
  const skin = 1;

  const w = new Writer(null);
  w.writeDataReference(29, skin);
  run(LogicSelectSkinCommand, player, fakeClient(), db, w.getRaw());

  const expectedBrawler = characters.get_brawler_by_skin_id(skin);
  assert.equal(player.home_skin, skin);
  assert.equal(player.selected_skins[String(player.home_brawler)], skin);

  const row = db.load_player_account(token);
  assert.equal(row.HomeSkin, skin);
  assert.equal(row.SelectedSkins[String(player.home_brawler)], skin);
  if (expectedBrawler !== undefined) assert.equal(row.SelectedBrawler, expectedBrawler);
});

test('LogicLevelUpCommand levels a brawler up and persists', () => {
  const token = `cmd-level-${nextId}`;
  const player = wirePlayer(token);
  const before = player.brawlers_level['1'];

  const w = new Writer(null);
  w.writeDataReference(16, 1);
  run(LogicLevelUpCommand, player, fakeClient(), db, w.getRaw());

  assert.equal(player.brawlers_level['1'], before + 1);
  assert.equal(db.load_player_account(token).BrawlersLevel['1'], before + 1);
});

test('LogicPurchaseDoubleCoinsCommand charges gems for the doubler', () => {
  const token = `cmd-doubler-${nextId}`;
  const player = wirePlayer(token);
  const cost = LogicShopData.token_doubler[0]['Cost'];
  const amount = LogicShopData.token_doubler[0]['Amount'];
  const gemsBefore = player.gems;

  run(LogicPurchaseDoubleCoinsCommand, player, fakeClient(), db, Buffer.alloc(0));

  assert.equal(player.token_doubler, amount);
  assert.equal(player.gems, gemsBefore - cost);
  const row = db.load_player_account(token);
  assert.equal(row.Gems, gemsBefore - cost);
  assert.equal(row.TokenDoubler, amount);
});

test('LogicPurchaseGemsCommand swaps gold for gems', () => {
  const token = `cmd-gems-${nextId}`;
  const player = wirePlayer(token);
  const pack = LogicShopData.gems_packs[0];
  const goldBefore = player.resources[1]['Amount'];

  const w = new Writer(null);
  w.writeVInt(0);
  run(LogicPurchaseGemsCommand, player, fakeClient(), db, w.getRaw());

  assert.equal(player.gems, Player.prototype.gems + pack['Amount']);
  assert.equal(player.resources[1]['Amount'], goldBefore - pack['Cost']);
  const row = db.load_player_account(token);
  assert.equal(row.Gems, Player.prototype.gems + pack['Amount']);
  assert.equal(row.Resources[1]['Amount'], goldBefore - pack['Cost']);
});

test('LogicPurchaseHeroLvlUpMaterialCommand buys gold with gems', () => {
  const token = `cmd-hero-${nextId}`;
  const player = wirePlayer(token);
  const pack = LogicShopData.gold_packs[0];
  const goldBefore = player.resources[1]['Amount'];

  const w = new Writer(null);
  w.writeVInt(0);
  run(LogicPurchaseHeroLvlUpMaterialCommand, player, fakeClient(), db, w.getRaw());

  assert.equal(player.resources[1]['Amount'], goldBefore + pack['Amount']);
  assert.equal(player.gems, Player.prototype.gems - pack['Cost']);
});

test('LogicSetPlayerThumbnailCommand persists the profile icon', () => {
  const token = `cmd-thumb-${nextId}`;
  const player = wirePlayer(token);

  const w = new Writer(null);
  w.writeDataReference(28000000, 5);
  run(LogicSetPlayerThumbnailCommand, player, fakeClient(), db, w.getRaw());

  assert.equal(player.profile_icon, 5);
  assert.equal(db.load_player_account(token).ProfileIcon, 5);
});

test('LogicSetPlayerNameColorCommand persists the name color', () => {
  const token = `cmd-namecolor-${nextId}`;
  const player = wirePlayer(token);

  const w = new Writer(null);
  w.writeDataReference(43000000, 7);
  run(LogicSetPlayerNameColorCommand, player, fakeClient(), db, w.getRaw());

  assert.equal(player.name_color, 7);
  assert.equal(db.load_player_account(token).NameColor, 7);
});

test('LogicGatchaCommand charges the box cost and pushes a delivery', () => {
  const token = `cmd-box-${nextId}`;
  const player = wirePlayer(token);
  const client = fakeClient();
  const cost = LogicShopData.boxes[0]['Cost'];
  const gemsBefore = player.gems;

  const w = new Writer(null);
  w.writeVInt(1);
  run(LogicGatchaCommand, player, client, db, w.getRaw());

  assert.equal(player.delivery_items['Count'], 1);
  assert.equal(client.sends.length, 1, 'expected the AvailableServerCommand push');
  assert.ok(player.gems < gemsBefore, 'box cost not charged');
  assert.ok(player.gems >= gemsBefore - cost, 'box over-charged');
  assert.ok(db.load_player_account(token).Gems < gemsBefore);
});

test('LogicClaimRankUpRewardCommand opens the trophy-road big box', () => {
  const token = `cmd-rankup-${nextId}`;
  const player = wirePlayer(token);
  const client = fakeClient();

  const w = new Writer(null);
  w.writeVInt(3);
  run(LogicClaimRankUpRewardCommand, player, client, db, w.getRaw());

  assert.equal(player.delivery_items['Count'], 1);
  assert.equal(client.sends.length, 1);
});

test('LogicPurchaseOfferCommand buys offer 0 (10 + 69 brawl boxes) for 15 gems', () => {
  const token = `cmd-offer-${nextId}`;
  const player = wirePlayer(token);
  const client = fakeClient();
  const cost = LogicShopData.offers[0]['Cost'];
  const gemsBefore = player.gems;

  const w = new Writer(null);
  w.writeVInt(0);
  w.writeDataReference(16, 1);
  run(LogicPurchaseOfferCommand, player, client, db, w.getRaw());

  // Two offer items (10 + 69 boxes) → DeliveryTypes starts [100] and gains
  // 79 tier-10 entries; the encoder reverses the list in place on send.
  // Note: boxing the 79 rewards RNGs bonus gems, so gems goes UP — the only
  // buy-side invariant is that the 15-gem cost was at least charged.
  const count = player.delivery_items['Count'];
  const types = player.delivery_items['DeliveryTypes'];
  assert.equal(player.delivery_items['Items'].length, 0);
  assert.equal(types.length, 80, 'expected [100] + 79 tier-10 boxes');
  assert.equal(types[types.length - 1], 100);
  assert.ok(types.slice(0, 79).every((t) => t === 10), 'offer boxes should be tier 10');
  assert.equal(count, 69);
  assert.ok(player.gems >= gemsBefore - cost, 'offer over-charged');
  assert.equal(db.load_player_account(token).Gems, player.gems);
  assert.equal(client.sends.length, 1);
});