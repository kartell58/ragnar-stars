/**
 * Regions sheet query (assets/csv-logic/regions.csv). Post-login the
 * client reports its location; get_region_string() resolves a region id back
 * to the locale string the account rows persist.
 */

const { CsvReader } = require('../csvReader');

const reader = new CsvReader();

class Regions {
  get_region_string(region_id) {
    const rowData = reader.readCsv('assets/csv-logic/regions.csv');
    for (const row of rowData) {
      if (rowData.indexOf(row) === region_id) return row[0];
    }
  }
}

module.exports = { Regions };