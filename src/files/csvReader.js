/**
 * CSV loader for the assets tables (assets/csv-logic/*.csv, the data
 * dumped from the original APK). Parses with full quote escaping, discards the
 * two header rows that the raw files carry, and caches results by filename so
 * each sheet is read off disk once. Paths are resolved against the repo root
 * (rootPath) — this works regardless of the server's current working dir.
 */

const fs = require('node:fs');
const { rootPath } = require('../utils/paths');

const CSV_CACHE = new Map();

function parseCsv(text) {
  const rows = [];
  const chars = text.split('');
  let i = 0;
  let row = [];
  let field = '';
  let inQuotes = false;
  const n = chars.length;
  while (i < n) {
    const c = chars[i];
    if (inQuotes) {
      if (c === '"') {
        if (chars[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && chars[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

class CsvReader {
  readCsv(filename) {
    if (CSV_CACHE.has(filename)) {
      return CSV_CACHE.get(filename);
    }
    this.rowData = [];
    this.lineCount = 0;
    const full = rootPath(filename);
    const lines = parseCsv(fs.readFileSync(full, 'utf-8'));
    for (const row of lines) {
      if (this.lineCount === 0 || this.lineCount === 1) {
        this.lineCount += 1;
      } else {
        this.rowData.push(row);
        this.lineCount += 1;
      }
    }
    CSV_CACHE.set(filename, this.rowData);
    return this.rowData;
  }
}

module.exports = { CsvReader, parseCsv };
