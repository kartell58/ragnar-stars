/**
 * Repo-root path resolution. ROOT is derived from this file's location (not
 * process.cwd()), and rootPath() joins targets against it so the server keeps
 * working no matter where it was launched from (config/*.json, assets/
 * csv-logic, assets/ascii.txt…). Absolute paths pass through unchanged.
 */

const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function rootPath(target) {
  return path.isAbsolute(target) ? target : path.resolve(ROOT, target);
}

module.exports = { ROOT, rootPath };