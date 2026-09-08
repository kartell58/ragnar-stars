/**
 * Graceful shutdown helper for the server entrypoints: SIGINT/SIGTERM close the
 * listener (plus any extraClose, e.g. closing the db) and exit 0.
 */

function start(server, name = 'server', extraClose = null) {
  const shutdown = () => {
    require('../utils/logger').log(`\x1b[36m[DEBUG] ${name} shutting down...\x1b[39m`);
    if (typeof server.close === 'function') server.close();
    if (typeof extraClose === 'function') extraClose();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { start };