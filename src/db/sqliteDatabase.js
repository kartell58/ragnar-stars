/**
 * SQLite driver for the account/club stores.
 *
 * `data`/`club_data` here are the AUTHORITATIVE column list AND default state:
 * every array/object field is JSON-serialized to a TEXT column, and _ensure_columns
 * ALTERs any legacy schema so it matches this list on boot. load_player_account
 * re-reads the row so missing defaults are backfilled before returning.
 * update_player_account throws on unknown columns instead of silently writing.
 */

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const config = require('../../config/default');
const { Player } = require('../logic/player');
const { runMigrations } = require('./migrate');
const { log } = require('../utils/logger');

const now = () => new Date().toISOString();

class SQLiteDatabase {
  constructor() {
    this.player = Player;
    const p = new Player();
    this.db_path = config.db.file;
    fs.mkdirSync(path.dirname(this.db_path), { recursive: true });

    this.data = {
      Name: 'Guest',
      NameSet: false,
      Gems: p.gems,
      Trophies: p.trophies,
      Tickets: p.tickets,
      Resources: p.resources,
      TokenDoubler: 0,
      HighestTrophies: p.high_trophies,
      HomeBrawler: 0,
      TrophyRoadReward: 1,
      ExperiencePoints: p.exp_points,
      ProfileIcon: 0,
      NameColor: 0,
      UnlockedBrawlers: p.brawlers_unlocked,
      BrawlersTrophies: p.brawlers_trophies,
      BrawlersHighestTrophies: p.brawlers_high_trophies,
      BrawlersLevel: p.brawlers_level,
      BrawlersPowerPoints: p.brawlers_powerpoints,
      UnlockedSkins: p.unlocked_skins,
      SelectedSkins: p.selected_skins,
      SelectedBrawler: 0,
      HomeSkin: 0,
      Region: p.region,
      SupportedContentCreator: 'Kartell',
      StarPower: p.starpower,
      Gadget: p.gadget,
      BrawlPassActivated: false,
      WelcomeMessageViewed: false,
      ClubID: 0,
      ClubRole: 1,
      Friends: [],
      TimeStamp: now(),
    };

    this.club_data = {
      Name: '',
      Description: '',
      Region: '',
      BadgeID: 0,
      Type: 0,
      Trophies: 0,
      RequiredTrophies: 0,
      FamilyFriendly: 0,
      Members: [],
      Messages: [],
    };

    this._player_cols = ['ID', 'Token'].concat(Object.keys(this.data));
    this._club_cols = ['ID'].concat(Object.keys(this.club_data));

    this.conn = new Database(this.db_path);
    this.conn.pragma('journal_mode = WAL');
    runMigrations(this.conn, config.migrations.dir);
    this._ensure_columns();

    log(`\x1b[36m[DEBUG] Database(sqlite3 - better-sqlite3) is ready!\x1b[39m`);
    log(`\x1b[36m[DB] Accounts store ready at ${this.db_path}\x1b[39m`);
  }

  _ensure_columns() {
    const existing_cols = this.conn.prepare('PRAGMA table_info(players)').all().map((r) => r.name);
    this.conn.transaction(() => {
      for (const key of Object.keys(this.data)) {
        if (!existing_cols.includes(key)) {
          this.conn.exec(`ALTER TABLE players ADD COLUMN "${key}" TEXT DEFAULT '[]'`);
        }
      }
    })();
  }

  is_player_banned(id) {
    const row = this.conn.prepare('SELECT 1 FROM admin_bans WHERE "player_id" = ?').get(Number(id));
    return Boolean(row);
  }

  _where(query) {
    if (query && Object.keys(query).length) {
      const conds = Object.keys(query).map((k) => `"${k}" = ?`).join(' AND ');
      const values = Object.entries(query).map(([k, v]) => (k === 'ID' || k === 'Token' ? v : JSON.stringify(v)));
      return { sql: `WHERE ${conds}`, values };
    }
    return { sql: '', values: [] };
  }

  _clone_default(value) {
    if (Array.isArray(value)) return value.slice();
    if (value !== null && typeof value === 'object') return { ...value };
    return value;
  }

  _encode_row(row, defaults) {
    const data = row;
    for (const key of Object.keys(defaults)) {
      if (data[key] !== null && data[key] !== undefined) data[key] = JSON.parse(data[key]);
      else data[key] = this._clone_default(defaults[key]);
    }
    return data;
  }

  _row_to_player(row) {
    const data = this._encode_row(row, this.data);
    if (data['ID'] !== null && data['ID'] !== undefined) data['ID'] = Number(data['ID']);
    return data;
  }

  _row_to_club(row) {
    const data = this._encode_row(row, this.club_data);
    if (data['ID'] !== null && data['ID'] !== undefined) data['ID'] = Number(data['ID']);
    return data;
  }

  _sort_value(value) {
    if (typeof value === 'number') return value;
    try {
      return parseInt(value, 10);
    } catch (e) {
      return 0;
    }
  }

  merge(dict1, dict2) {
    Object.assign(dict1, dict2);
  }

  create_player_account(id, token) {
    const auth = { ID: id, Token: token };
    Object.assign(auth, this.data);

    const cols = Object.keys(auth).map((c) => `"${c}"`).join(', ');
    const placeholders = Object.keys(auth).map(() => '?').join(', ');
    const values = Object.entries(auth).map(([c, v]) => (c === 'ID' || c === 'Token' ? v : JSON.stringify(v)));

    this.conn.prepare(`INSERT INTO players (${cols}) VALUES (${placeholders})`).run(values);
  }

  load_player_account(token) {
    let row = this.conn.prepare('SELECT * FROM players WHERE "Token" = ?').get(token);
    if (row) {
      let result = this._row_to_player(row);
      for (const x of Object.keys(this.data)) {
        if (!(x in result)) this.update_player_account(token, x, this.data[x]);
      }
      row = this.conn.prepare('SELECT * FROM players WHERE "Token" = ?').get(token);
      return this._row_to_player(row);
    }
    return null;
  }

  load_player_account_by_id(id) {
    const row = this.conn.prepare('SELECT * FROM players WHERE "ID" = ?').get(id);
    if (row) return this._row_to_player(row);
    return null;
  }

  update_player_account(token, item, value) {
    if (!(item in this.data)) throw new Error(`Unknown player column: ${item}`);
    this.conn.prepare('UPDATE players SET "' + item + '" = ? WHERE "Token" = ?').run(JSON.stringify(value), token);
  }

  update_all_players(query, item, value) {
    if (!(item in this.data)) throw new Error(`Unknown player column: ${item}`);
    const { sql, values } = this._where(query);
    this.conn.prepare(`UPDATE players SET "${item}" = ? ${sql}`).run([JSON.stringify(value)].concat(values));
  }

  delete_all_players(args) {
    const { sql, values } = this._where(args);
    this.conn.prepare(`DELETE FROM players ${sql}`).run(values);
  }

  delete_player(token) {
    this.conn.prepare('DELETE FROM players WHERE "Token" = ?').run(token);
  }

  load_all_players(args) {
    const { sql, values } = this._where(args);
    const rows = this.conn.prepare(`SELECT * FROM players ${sql}`).all(values);
    return rows.map((r) => this._row_to_player(r));
  }

  load_all_players_sorted(args, element, element2 = null) {
    const docs = this.load_all_players(args);

    if (element2 !== null) {
      const trophy_key = String(element2);
      const filtered = docs.filter(
        (d) => this._sort_value((d.BrawlersTrophies || {})[trophy_key]) !== 0,
      );
      filtered.sort(
        (a, b) =>
          this._sort_value((b.BrawlersTrophies || {})[trophy_key] ?? 0) -
          this._sort_value((a.BrawlersTrophies || {})[trophy_key] ?? 0),
      );
      return filtered;
    }

    docs.sort((a, b) => this._sort_value(b[element] ?? 0) - this._sort_value(a[element] ?? 0));
    return docs;
  }

  create_club(id, data) {
    const auth = { ID: id };
    Object.assign(auth, data);

    for (const key of Object.keys(this.club_data)) {
      if (!(key in auth)) auth[key] = this.club_data[key];
    }

    const cols = Object.keys(auth).map((c) => `"${c}"`).join(', ');
    const placeholders = Object.keys(auth).map(() => '?').join(', ');
    const values = Object.entries(auth).map(([c, v]) => (c === 'ID' ? v : JSON.stringify(v)));

    this.conn.prepare(`INSERT INTO clubs (${cols}) VALUES (${placeholders})`).run(values);
  }

  update_club(id, item, value) {
    if (!(item in this.club_data)) throw new Error(`Unknown club column: ${item}`);
    this.conn.prepare('UPDATE clubs SET "' + item + '" = ? WHERE "ID" = ?').run(JSON.stringify(value), id);
  }

  load_club(id) {
    let row = this.conn.prepare('SELECT * FROM clubs WHERE "ID" = ?').get(id);
    if (row) {
      let result = this._row_to_club(row);
      for (const x of Object.keys(this.club_data)) {
        if (!(x in result)) this.update_club(id, x, this.club_data[x]);
      }
      row = this.conn.prepare('SELECT * FROM clubs WHERE "ID" = ?').get(id);
      return this._row_to_club(row);
    }
    return null;
  }

  load_all_clubs_sorted(args, element) {
    const docs = this.load_all_clubs(args);
    docs.sort((a, b) => this._sort_value(b[element] ?? 0) - this._sort_value(a[element] ?? 0));
    return docs;
  }

  load_all_clubs(args) {
    const { sql, values } = this._where(args);
    const rows = this.conn.prepare(`SELECT * FROM clubs ${sql}`).all(values);
    return rows.map((r) => this._row_to_club(r));
  }

  delete_club(id) {
    this.conn.prepare('DELETE FROM clubs WHERE "ID" = ?').run(id);
  }

  close() {
    if (this.conn && this.conn.open) {
      try {
        this.conn.close();
      } catch (e) {
        log(`\x1b[91m[DB] Failed to close database: ${e.message}\x1b[39m`);
      }
    }
  }
}

module.exports = { SQLiteDatabase };