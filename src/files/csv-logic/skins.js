/**
 * Skins sheet query (assets/csv-logic/skins.csv). get_skins_id() lists
 * every skin row id — the catalog the server hands the client so its shop and
 * profile views can render unlockable cosmetics.
 */

const { CsvReader } = require('../csvReader');

const reader = new CsvReader();

class Skins {
  get_skins_id() {
    const skinsId = [];
    const rowData = reader.readCsv('assets/csv-logic/skins.csv');
    rowData.forEach((row) => skinsId.push(rowData.indexOf(row)));
    return skinsId;
  }
}

module.exports = { Skins };