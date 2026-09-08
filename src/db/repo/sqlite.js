/**
 * Data-access layer exposed to handlers — the snake_case API the protocol
 * messages use (load_player_account / update_player_account / create_club …),
 * never raw SQL in a feature. A thin facade over SQLiteDatabase; getRepo()
 * hands out one shared instance.
 */

const { SQLiteDatabase } = require('../sqliteDatabase');

class SqliteRepo {
  constructor(db) {
    this.store = db || new SQLiteDatabase();
  }

  get conn() {
    return this.store.conn;
  }

  get db_path() {
    return this.store.db_path;
  }

  get data() {
    return this.store.data;
  }

  get club_data() {
    return this.store.club_data;
  }

  _row_to_player(row) {
    return this.store._row_to_player(row);
  }

  _row_to_club(row) {
    return this.store._row_to_club(row);
  }

  merge(dict1, dict2) {
    return this.store.merge(dict1, dict2);
  }

  is_player_banned(id) {
    return this.store.is_player_banned(id);
  }

  create_player_account(id, token) {
    return this.store.create_player_account(id, token);
  }

  load_player_account(token) {
    return this.store.load_player_account(token);
  }

  load_player_account_by_id(id) {
    return this.store.load_player_account_by_id(id);
  }

  update_player_account(token, item, value) {
    return this.store.update_player_account(token, item, value);
  }

  update_all_players(query, item, value) {
    return this.store.update_all_players(query, item, value);
  }

  delete_all_players(args) {
    return this.store.delete_all_players(args);
  }

  delete_player(token) {
    return this.store.delete_player(token);
  }

  load_all_players(args) {
    return this.store.load_all_players(args);
  }

  load_all_players_sorted(args, element, element2 = null) {
    return this.store.load_all_players_sorted(args, element, element2);
  }

  create_club(id, data) {
    return this.store.create_club(id, data);
  }

  update_club(id, item, value) {
    return this.store.update_club(id, item, value);
  }

  load_club(id) {
    return this.store.load_club(id);
  }

  load_all_clubs(args) {
    return this.store.load_all_clubs(args);
  }

  load_all_clubs_sorted(args, element) {
    return this.store.load_all_clubs_sorted(args, element);
  }

  delete_club(id) {
    return this.store.delete_club(id);
  }

  close() {
    return this.store.close();
  }
}

module.exports = { SqliteRepo };