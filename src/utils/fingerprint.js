/**
 * Fingerprint (config/fingerprint config used to keep the client versioned).
 * loadFinger() reads just the `sha` field (the value sent in login responses);
 * loadFingerFull() returns the WHOLE file reproduced in Python-json pretty
 * style (pyJsonDumps) — the client compares the full fingerprint string, so
 * abbreviating here would desync it.
 */

const fs = require('node:fs');
const { log, error } = require('./logger');
const { rootPath } = require('./paths');

function pyJsonDumps(v) {
  if (v === null || v === undefined) return 'null';
  const t = typeof v;
  if (t === 'string') return JSON.stringify(v);
  if (t === 'boolean' || t === 'number') return String(v);
  if (Array.isArray(v)) return '[' + v.map(pyJsonDumps).join(', ') + ']';
  const items = Object.entries(v).map(([k, val]) => `${JSON.stringify(k)}: ${pyJsonDumps(val)}`);
  return '{' + items.join(', ') + '}';
}

class Fingerprint {
  static loadFinger(filePath) {
    try {
      const fingerContent = JSON.parse(fs.readFileSync(rootPath(filePath), 'utf-8'));
      return fingerContent['sha'];
    } catch (e) {
      log(`Could not load fingerprint: ${e}`);
    }
  }

  static loadFingerFull(filePath) {
    try {
      const fingerContent = JSON.parse(fs.readFileSync(rootPath(filePath), 'utf-8'));
      return pyJsonDumps(fingerContent);
    } catch (e) {
      error(`Could not load fingerprint: ${e}`);
    }
  }
}

module.exports = { Fingerprint, pyJsonDumps };