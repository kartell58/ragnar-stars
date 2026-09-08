/**
 * Admin daemon entrypoint (node src/servers/admin.js / `npm run admin` boots
 * the REPL CLI instead). Loads AdminCore against the same db and prints a
 * stats snapshot; keeps the process alive for the console front.
 */

const { createBaseContext } = require('../apps/base');
const { createAdminApp } = require('../apps/adminApp');
const { log } = require('../utils/logger');

function runAdminServer() {
  const ctx = createBaseContext();
  const app = createAdminApp(ctx);
  log('[admin] AdminCore loaded.');
  log(`[admin] stats: ${JSON.stringify(app.core.stats())}`);
  log('[admin] interactive console -> npm run admin');
  const keepAlive = setInterval(() => {}, 1 << 30);
  return { app, stop: () => clearInterval(keepAlive) };
}

if (require.main === module) {
  runAdminServer();
}

module.exports = { runAdminServer };