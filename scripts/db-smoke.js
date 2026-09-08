const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmp = path.join(os.tmpdir(), `bs-db-smoke-${process.pid}.db`);
process.env.DB_FILE = tmp;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const config = require('../config/default');
const { getRepo } = require('../src/db/repo');

function cleanup() {
  for (const f of [tmp, `${tmp}-wal`, `${tmp}-shm`]) {
    try {
      fs.unlinkSync(f);
    } catch (e) {
      // pass
    }
  }
}

if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

try {
  const db = getRepo();

  const id = Math.floor((Date.now() % 100000000) * 1000 + config.net.port);
  const token = `smoke-tok-${process.pid}-${id}`;

  db.create_player_account(id, token);
  console.log('  created player', id);

  const acc = db.load_player_account(token);
  assert(acc && acc.ID === id, 'load_player_account returned an invalid account');
  assert(acc.Token === token, 'load_player_account wrong token');
  assert(typeof acc.Name === 'string' && acc.Name.length > 0, `default Name missing: ${JSON.stringify(acc.Name)}`);
  assert(typeof acc.Trophies === 'number', 'Trophies missing');
  assert(Array.isArray(acc.UnlockedBrawlers), 'UnlockedBrawlers must be an array');

  const byId = db.load_player_account_by_id(id, token);
  assert(byId && byId.ID === id, 'invalid load_player_account_by_id');

  assert(db.load_player_account_by_id(999999999) === null, 'missing account should return null');

  db.update_player_account(token, 'Name', 'SmokeTester');
  db.update_player_account(token, 'NameSet', true);
  const renamed = db.load_player_account(token);
  assert(renamed.Name === 'SmokeTester', `update Name failed: ${renamed.Name}`);
  assert(renamed.NameSet === true, 'update NameSet failed');

  assert(db.is_player_banned(id) === false, 'unexpected is_player_banned(true)');
  db.conn
    .prepare('INSERT INTO admin_bans (player_id, reason, banned_by, created_at) VALUES (?, ?, ?, ?)')
    .run(id, 'smoke', 'smoke', new Date().toISOString());
  assert(db.is_player_banned(id) === true, 'is_player_banned(false) after ban');
  db.conn.prepare('DELETE FROM admin_bans WHERE player_id = ?').run(id);
  assert(db.is_player_banned(id) === false, 'unban failed');

  db.create_club(90001, { Name: 'SmokeClub', Description: 'smoke' });
  db.update_club(90001, 'Description', 'smoke-updated');
  const club = db.load_club(90001);
  assert(club && club.Name === 'SmokeClub' && club.Description === 'smoke-updated', 'load_club/update_club failed');
  const clubs = db.load_all_clubs_sorted(undefined, 'Name');
  assert(clubs.some((c) => c.Name === 'SmokeClub'), 'load_all_clubs_sorted without SmokeClub');
  db.delete_club(90001);
  assert(db.load_club(90001) === null, 'delete_club failed');

  const sorted = db.load_all_players_sorted();
  assert(Array.isArray(sorted) && sorted.length >= 1, 'empty/invalid load_all_players_sorted');

  db.delete_player(token);
  assert(db.load_player_account(token) === null, 'delete_player failed');

  db.close();

  console.log('[db-smoke] OK');
  console.log('  db file: tmp (removed)');
  cleanup();
} catch (err) {
  console.error(`FAIL: ${err.stack || err.message}`);
  cleanup();
  process.exit(1);
}