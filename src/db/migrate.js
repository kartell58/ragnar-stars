/**
 * Versioned SQL migration runner. Files in migrations/ apply in filename order
 * inside a transaction, each one recorded in the _migrations table, so boot is
 * idempotent (also `npm run migrate`). Rule of the repo: NEVER rewrite an old
 * migrations/*.sql — schema changes go in a NEW numbered file, because applied
 * ones are already marked as done.
 */

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const config = require('../../config/default');
const { log } = require('../utils/logger');

function ensureMigrationsTable(conn) {
  conn.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
       "name" TEXT PRIMARY KEY,
       "applied_at" TEXT NOT NULL
     )`,
  );
}

function runMigrations(conn, dir = config.migrations.dir) {
  ensureMigrationsTable(conn);
  const applied = new Set(conn.prepare('SELECT "name" FROM _migrations').all().map((r) => r.name));
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort() : [];

  const apply = conn.transaction((file, sql) => {
    conn.exec(sql);
    conn
      .prepare('INSERT INTO _migrations ("name", "applied_at") VALUES (?, ?)')
      .run(file, new Date().toISOString());
  });

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    apply(file, sql);
    log(`[migrate] applied ${file}`);
    ran += 1;
  }

  log(ran ? `[migrate] applied ${ran} migration(s)` : '[migrate] up to date');
  return ran;
}

if (require.main === module) {
  const conn = new Database(config.db.file);
  conn.pragma('journal_mode = WAL');
  try {
    runMigrations(conn);
  } finally {
    conn.close();
  }
}

module.exports = { runMigrations, ensureMigrationsTable };