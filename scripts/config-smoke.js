/**
 * Smoke-test for config/default.js (part of `npm run smoke`): asserts the
 * config object has the right SHAPE (env string, net host/port, db file,
 * game keys, BannedIPs array…) so a broken/missing config fails loudly at the
 * start of every suite instead of mid-boot.
 */

const config = require('../config/default');

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

try {
  assert(typeof config.env === 'string', 'config.env must be a string');
  assert(Number.isInteger(config.net.port) && config.net.port > 0, `invalid net.port: ${config.net.port}`);
  assert(typeof config.net.host === 'string' && config.net.host.length, 'invalid net.host');
  assert(typeof config.db.file === 'string' && config.db.file.length, 'invalid db.file');
  assert(typeof config.migrations.dir === 'string', 'invalid migrations.dir');

  assert(typeof config.game === 'object' && config.game, 'config.game must be an object');
  assert(config.game.UpgradesEnabled === undefined, 'config.game.UpgradesEnabled must be gone');
  assert(Array.isArray(config.game.BannedIPs), 'config.game.BannedIPs must be an array');
  assert(typeof config.game.Region === 'string', 'config.game.Region must be a string');

  console.log('[config-smoke] OK');
  console.log('  env      :', config.env);
  console.log('  net      :', `${config.net.host}:${config.net.port}`);
  console.log('  db       :', config.db.file);
  console.log('  game keys:', Object.keys(config.game).length);
  console.log('  BannedIPs:', config.game.BannedIPs.length);
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}