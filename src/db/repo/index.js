/**
 * Data-access singleton. getRepo() builds the SqliteRepo once and reuses it —
 * messages/services never construct their own backends. resetRepo() exists for
 * the smoke suite, which swaps in a disposable temp-file repo.
 */

const { SqliteRepo } = require('./sqlite');
const { log } = require('../../utils/logger');

let repo = null;

function getRepo() {
  if (repo) return repo;
  repo = new SqliteRepo();
  log('[repo] backend: SQLite (better-sqlite3)');
  return repo;
}

function resetRepo() {
  repo = null;
}

module.exports = { getRepo, resetRepo };