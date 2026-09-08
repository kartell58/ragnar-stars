/**
 * Game server entrypoint (node src/servers/login.js or `npm run login`).
 *
 * Historically this duplicated src/server.js's boot wiring. The canonical boot
 * now lives in src/server.js (banner + base ctx + game app + graceful shutdown
 * that closes the db); this file is kept as a thin alias so both the documented
 * `npm run start` and `npm run login` paths behave identically.
 */

const server = require('../server');

if (require.main === module) {
  server.boot();
}

module.exports = { runLoginServer: () => server.boot() };