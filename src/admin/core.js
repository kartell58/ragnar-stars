const fs = require('node:fs');
const { Helpers } = require('../utils/helpers');
const { getRepo } = require('../db/repo');
const { log } = require('../utils/logger');

let Player = null;
try {
  Player = require('../logic/player').Player;
} catch (e) {
  Player = null;
}

function now() {
  return new Date().toISOString();
}

const BRAWLER_NAMES = {
  0: 'Shelly',
  1: 'Colt',
  2: 'Bull',
  3: 'Brock',
  4: 'Rico',
  5: 'Spike',
  6: 'Barley',
  7: 'Jessie',
  8: 'Nita',
  9: 'Dynamike',
  10: 'El Primo',
  11: 'Mortis',
  12: 'Crow',
  13: 'Poco',
  14: 'Bo',
  15: 'Piper',
  16: 'Pam',
  17: 'Tara',
  18: 'Darryl',
  19: 'Penny',
  20: 'Frank',
  21: 'Gene',
  22: 'Tick',
  23: 'Leon',
  24: 'Rosa',
  25: 'Carl',
  26: 'Bibi',
  27: '8-Bit',
  28: 'Sandy',
  29: 'Bea',
  30: 'Emz',
  31: 'Mr. P',
  32: 'Max',
  34: 'Jacky',
  37: 'Sprout',
};

class AdminCore {
  constructor({ actor = 'console', db = null } = {}) {
    this.actor = actor;
    this.db = db || getRepo();
    this.conn = this.db.conn;
    this._cache = {};
  }

  close() {
    if (this.db && this.db.conn && this.db.conn.open) {
      try {
        this.db.close();
      } catch (e) {
        log(`\x1b[91m[ADMIN] Failed to close database: ${e.message}\x1b[39m`);
      }
    }
  }

  _normId(value) {
    const n = Number(value);
    return Number.isFinite(n) && String(value).trim() !== '' ? n : value;
  }

  _audit(action, targetType, targetId, reason = null) {
    this.conn
      .prepare(
        'INSERT INTO admin_audit ("created_at", "actor", "action", "target_type", "target_id", "reason") VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(now(), this.actor, action, targetType, targetId == null ? null : String(targetId), reason || null);
  }

  _allPlayers() {
    const rows = this.conn.prepare('SELECT * FROM players ORDER BY "ID"').all();
    return rows.map((r) => this.db._row_to_player(r));
  }

  _resolvePlayer(query) {
    if (query == null || query === '') return null;
    const q = String(query).trim();
    if (/^\d+$/.test(q)) {
      const byId = this.db.load_player_account_by_id(Number(q));
      if (byId) return byId;
    }
    const byToken = this.conn.prepare('SELECT * FROM players WHERE "Token" = ?').get(q);
    if (byToken) return this.db._row_to_player(byToken);
    const want = q.toLowerCase();
    return this._allPlayers().find((p) => String(p.Name ?? '').toLowerCase() === want) || null;
  }

  _connectedClients() {
    return Helpers.connected_clients['Clients'] || {};
  }

  _sessionEntry(entry) {
    const p = entry.Player || {};
    const ip = entry.SocketInfo && entry.SocketInfo.remoteAddress ? String(entry.SocketInfo.remoteAddress).replace(/^::ffff:/, '') : '-';
    return {
      serverId: this._normId(p.ID),
      profileName: p.name ?? '?',
      username: p.name ?? p.token ?? '?',
      token: p.token ?? null,
      clientIp: ip,
    };
  }

  _sessionsForPlayer(id) {
    const want = String(id);
    return Object.values(this._connectedClients())
      .filter((e) => String(e.Player?.ID) === want)
      .map((e) => this._sessionEntry(e));
  }

  _kickPlayer(playerOrId) {
    const want = String(typeof playerOrId === 'object' ? playerOrId.ID : playerOrId);
    const clients = this._connectedClients();
    let count = 0;
    for (const key of Object.keys(clients)) {
      if (String(clients[key].Player?.ID) === want) {
        count += 1;
        try {
          clients[key].SocketInfo.destroy();
        } catch (e) {
          // already closed
        }
        delete clients[key];
      }
    }
    return count;
  }

  _bannedRow(id) {
    const row = this.conn.prepare('SELECT * FROM admin_bans WHERE "player_id" = ?').get(Number(id));
    if (!row) return null;
    return { bannedBy: row.banned_by, reason: row.reason || null, createdAt: row.created_at };
  }

  _brawlerIds() {
    if (this._cache.brawlers === undefined) this._cache.brawlers = Player && Array.isArray(Player.brawlers_id) ? Player.brawlers_id : null;
    return this._cache.brawlers;
  }

  _skinIds() {
    if (this._cache.skins === undefined) this._cache.skins = Player && Array.isArray(Player.skins_id) ? Player.skins_id : null;
    return this._cache.skins;
  }

  _prettify(value) {
    if (value == null || String(value) === '') return '-';
    const words = String(value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();
    if (!words) return '-';
    return words.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _nameMaps() {
    if (this._cache.nameMaps) return this._cache.nameMaps;
    const maps = { brawlers: new Map(), skins: new Map() };
    try {
      const { CsvReader } = require('../files/csvReader');
      const chars = new CsvReader().readCsv('assets/csv-logic/characters.csv');
      const charToId = new Map();
      chars.forEach((row, index) => {
        if (row[20] === 'Hero' && String(row[2]).toLowerCase() !== 'true' && String(row[1]).toLowerCase() !== 'true') {
          charToId.set(row[0], index);
          maps.brawlers.set(index, BRAWLER_NAMES[index] || this._prettify(row[0]));
        }
      });

      const confs = new CsvReader().readCsv('assets/csv-logic/skinConfs.csv');
      const confToBrawler = new Map();
      for (const row of confs) {
        const brawlId = charToId.get(row[1]);
        if (brawlId !== undefined) confToBrawler.set(row[0], brawlId);
      }

      const skins = new CsvReader().readCsv('assets/csv-logic/skins.csv');
      skins.forEach((row, index) => {
        const internal = row[0];
        const conf = row[1];
        const brawlId = confToBrawler.get(conf);
        const charName = brawlId !== undefined ? chars[brawlId][0] : null;
        const brawlerName = brawlId !== undefined ? maps.brawlers.get(brawlId) : null;

        if (charName && (conf && conf.toLowerCase().endsWith('default') || internal.toLowerCase().endsWith('default'))) {
          maps.skins.set(index, brawlerName);
        } else if (charName) {
          const rest = internal.replace(new RegExp(`^${charName}`, 'i'), '');
          maps.skins.set(index, `${this._prettify(rest || internal)} (${brawlerName})`);
        } else {
          maps.skins.set(index, this._prettify(internal));
        }
      });
    } catch (e) {
      // CSV files unavailable; names stay empty
    }
    this._cache.nameMaps = maps;
    return maps;
  }

  _heroName(id) {
    return this._nameMaps().brawlers.get(Number(id)) || null;
  }

  _skinName(id) {
    return this._nameMaps().skins.get(Number(id)) || null;
  }

  listUsers() {
    const connected = this._connectedClients();
    return this._allPlayers().map((p) => {
      const ban = this._bannedRow(p.ID);
      return {
        id: this._normId(p.ID),
        name: p.Name,
        tokens: p.Token ? 1 : 0,
        connected: String(p.ID) in connected,
        banned: Boolean(ban),
        banReason: ban ? ban.reason : null,
      };
    });
  }

  whois(query) {
    const p = this._resolvePlayer(query);
    if (!p) return { found: false, identifier: String(query) };
    const ban = this._bannedRow(p.ID);
    const sessions = this._sessionsForPlayer(p.ID);
    return {
      found: true,
      identifier: String(query),
      user: {
        id: this._normId(p.ID),
        name: p.Name,
        token: p.Token,
        trophies: p.Trophies,
        highTrophies: p.HighestTrophies,
        gems: p.Gems,
        tickets: p.Tickets,
        exp: p.ExperiencePoints,
        hero: p.SelectedBrawler ?? p.HomeBrawler ?? 0,
        heroName: this._heroName(p.SelectedBrawler ?? p.HomeBrawler ?? 0),
        skin: p.HomeSkin ?? 0,
        skinName: this._skinName(p.HomeSkin ?? 0),
        unlockedBrawlers: (p.UnlockedBrawlers || []).length,
        unlockedSkins: (p.UnlockedSkins || []).length,
        clubId: p.ClubID ?? 0,
        region: p.Region,
        createdAt: p.TimeStamp,
      },
      banned: Boolean(ban),
      banReason: ban ? ban.reason : null,
      bannedBy: ban ? ban.bannedBy : null,
      sessions,
    };
  }

  find(query) {
    const q = String(query || '').toLowerCase();
    if (!q) return [];
    const connected = this._connectedClients();
    return this._allPlayers()
      .filter(
        (p) =>
          String(p.Name ?? '').toLowerCase().includes(q) ||
          String(p.ID).includes(q) ||
          String(p.Token ?? '').toLowerCase().includes(q),
      )
      .slice(0, 25)
      .map((p) => {
        const ban = this._bannedRow(p.ID);
        return {
          id: this._normId(p.ID),
          name: p.Name,
          tokens: p.Token ? 1 : 0,
          connected: String(p.ID) in connected,
          banned: Boolean(ban),
          banReason: ban ? ban.reason : null,
        };
      });
  }

  profile(query) {
    const p = this._resolvePlayer(query);
    if (!p) return { found: false, identifier: String(query) };
    const ban = this._bannedRow(p.ID);
    return {
      found: true,
      identifier: String(query),
      id: this._normId(p.ID),
      name: p.Name,
      token: p.Token,
      trophies: p.Trophies,
      highTrophies: p.HighestTrophies,
      gems: p.Gems,
      tickets: p.Tickets,
      exp: p.ExperiencePoints,
      profileIcon: p.ProfileIcon ?? 0,
      nameColor: p.NameColor ?? 0,
      hero: p.SelectedBrawler ?? p.HomeBrawler ?? 0,
      heroName: this._heroName(p.SelectedBrawler ?? p.HomeBrawler ?? 0),
      skin: p.HomeSkin ?? 0,
      skinName: this._skinName(p.HomeSkin ?? 0),
      unlockedBrawlers: p.UnlockedBrawlers || [],
      unlockedSkins: p.UnlockedSkins || [],
      brawlersLevel: p.BrawlersLevel || {},
      brawlersPowerPoints: p.BrawlersPowerPoints || {},
      clubId: p.ClubID ?? 0,
      clubRole: p.ClubRole ?? 0,
      region: p.Region,
      createdAt: p.TimeStamp,
      banned: Boolean(ban),
      banReason: ban ? ban.reason : null,
    };
  }

  createProfile(name) {
    const clean = String(name || '').trim();
    if (!clean) return { error: 'name required' };
    const id = Helpers.randomID();
    const token = Helpers.randomToken();
    this.db.create_player_account(id, token);
    this.db.update_player_account(token, 'Name', clean);
    this.db.update_player_account(token, 'NameSet', true);
    this._audit('create-profile', 'player', id, `name=${clean}`);
    return { created: true, id, token, name: clean };
  }

  deleteUser(target, yes) {
    return this._deletePlayer('delete-user', target, yes);
  }

  deleteProfile(target, yes) {
    return this._deletePlayer('delete-profile', target, yes);
  }

  _deletePlayer(action, target, yes) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    if (yes !== true) return { error: 'confirmation required; pass --yes', id: this._normId(p.ID), name: p.Name };
    this.conn.prepare('DELETE FROM admin_bans WHERE "player_id" = ?').run(Number(p.ID));
    this._kickPlayer(p);
    if (p.ClubID) this.conn.prepare('DELETE FROM clubs WHERE "ID" = ?').run(p.ClubID);
    this.conn.prepare('DELETE FROM players WHERE "ID" = ?').run(p.ID);
    this._audit(action, 'player', p.ID);
    return { found: true, deleted: true, id: this._normId(p.ID), name: p.Name };
  }

  setHero(idPlayer, idHero) {
    const p = this._resolvePlayer(idPlayer);
    if (!p) return { found: false, identifier: String(idPlayer) };
    const hero = Number(idHero);
    if (!Number.isInteger(hero)) return { error: 'invalid hero id' };
    const ids = this._brawlerIds();
    if (ids && !ids.includes(hero)) return { error: `unknown hero id ${idHero}` };
    this.db.update_player_account(p.Token, 'SelectedBrawler', hero);
    this.db.update_player_account(p.Token, 'HomeBrawler', hero);
    this._audit('set-hero', 'player', p.ID, `hero=${hero}`);
    return { found: true, id: this._normId(p.ID), name: p.Name, hero };
  }

  setSkin(idPlayer, idSkin) {
    const p = this._resolvePlayer(idPlayer);
    if (!p) return { found: false, identifier: String(idPlayer) };
    const skin = Number(idSkin);
    if (!Number.isInteger(skin)) return { error: 'invalid skin id' };
    const ids = this._skinIds();
    if (ids && !ids.includes(skin)) return { error: `unknown skin id ${idSkin}` };
    const current = p.SelectedBrawler ?? p.HomeBrawler ?? 0;
    const selected = p.SelectedSkins && typeof p.SelectedSkins === 'object' ? { ...p.SelectedSkins } : {};
    selected[String(current)] = skin;
    this.db.update_player_account(p.Token, 'HomeSkin', skin);
    this.db.update_player_account(p.Token, 'SelectedSkins', selected);
    this._audit('set-skin', 'player', p.ID, `skin=${skin}`);
    return { found: true, id: this._normId(p.ID), name: p.Name, skin };
  }

  sessions() {
    return Object.values(this._connectedClients()).map((e) => this._sessionEntry(e));
  }

  session(serverId) {
    const entry = Object.values(this._connectedClients()).find((e) => String(e.Player?.ID) === String(serverId));
    if (!entry) return { found: false, serverId: String(serverId) };
    return { found: true, ...this._sessionEntry(entry) };
  }

  revokeSession(serverId) {
    const clients = this._connectedClients();
    const key = Object.keys(clients).find((k) => String(clients[k].Player?.ID) === String(serverId));
    if (!key) return { found: false, serverId: String(serverId) };
    try {
      clients[key].SocketInfo.destroy();
    } catch (e) {
      // already closed
    }
    delete clients[key];
    this._audit('revoke-session', 'session', serverId);
    return { found: true, serverId: String(serverId), revoked: true };
  }

  invalidate(token) {
    const p = this._resolvePlayer(token);
    if (!p) return { found: false, identifier: String(token) };
    const replacement = Helpers.randomToken();
    this.conn.prepare('UPDATE players SET "Token" = ? WHERE "Token" = ?').run(replacement, p.Token);
    this._kickPlayer(p);
    this._audit('invalidate', 'player', p.ID);
    return { found: true, id: this._normId(p.ID), name: p.Name, invalidated: true };
  }

  revoke(target) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    const replacement = Helpers.randomToken();
    this.conn.prepare('UPDATE players SET "Token" = ? WHERE "Token" = ?').run(replacement, p.Token);
    const kicked = this._kickPlayer(p);
    this._audit('revoke', 'player', p.ID);
    return { found: true, id: this._normId(p.ID), name: p.Name, revoked: true, kicked };
  }

  kick(target, reason = undefined) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    const kicked = this._kickPlayer(p);
    this._audit('kick', 'player', p.ID, reason);
    return { found: true, id: this._normId(p.ID), name: p.Name, kicked };
  }

  ban(target, reason = undefined) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    this.conn
      .prepare(
        'INSERT INTO admin_bans ("player_id", "reason", "banned_by", "created_at") VALUES (?, ?, ?, ?) ON CONFLICT("player_id") DO UPDATE SET "reason" = excluded."reason", "banned_by" = excluded."banned_by", "created_at" = excluded."created_at"',
      )
      .run(Number(p.ID), reason || '', this.actor, now());
    const kicked = this._kickPlayer(p);
    this._audit('ban', 'player', p.ID, reason);
    return { found: true, id: this._normId(p.ID), name: p.Name, banned: true, reason: reason || null, kicked };
  }

  unban(target) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    const info = this._bannedRow(p.ID);
    this.conn.prepare('DELETE FROM admin_bans WHERE "player_id" = ?').run(Number(p.ID));
    this._audit('unban', 'player', p.ID);
    return { found: true, id: this._normId(p.ID), name: p.Name, banned: false, unbanned: Boolean(info) };
  }

  banInfo(target) {
    const p = this._resolvePlayer(target);
    if (!p) return { found: false, identifier: String(target) };
    const info = this._bannedRow(p.ID);
    if (!info) return { found: true, id: this._normId(p.ID), name: p.Name, banned: false };
    return { found: true, id: this._normId(p.ID), name: p.Name, banned: true, reason: info.reason, bannedBy: info.bannedBy, createdAt: info.createdAt };
  }

  stats() {
    const count = (sql) => this.conn.prepare(sql).get().c;
    const secs = Math.floor(process.uptime());
    return {
      players: count('SELECT COUNT(*) c FROM players'),
      clubs: count('SELECT COUNT(*) c FROM clubs'),
      banned: count('SELECT COUNT(*) c FROM admin_bans'),
      connected: Object.keys(this._connectedClients()).length,
      skins: count('SELECT COUNT(*) c FROM players WHERE "UnlockedSkins" IS NOT NULL AND json_valid("UnlockedSkins")'),
      uptime: secs,
    };
  }

  health() {
    const checks = {};
    try {
      this.conn.prepare('SELECT 1').get();
      checks.database = { ok: true };
    } catch (e) {
      checks.database = { ok: false, reason: e.message };
    }
    try {
      fs.statSync(this.db.db_path);
      checks.storage = { ok: true };
    } catch (e) {
      checks.storage = { ok: false, reason: e.message };
    }
    const connected = Object.keys(this._connectedClients()).length;
    checks.sessions = { ok: true, reason: `${connected} connected` };
    checks.process = { ok: true };
    return checks;
  }

  auditLog({ limit = 50 } = {}) {
    const n = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    return this.conn.prepare('SELECT * FROM admin_audit ORDER BY "id" DESC LIMIT ?').all(n);
  }
}

module.exports = { AdminCore };