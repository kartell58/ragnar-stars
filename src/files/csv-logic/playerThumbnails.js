/**
 * Player thumbnails sheet query (assets/csv-logic/playerThumbnails.csv).
 * get_thumbnails_id() returns every row id so the server can validate/emit the
 * profile-icon choices the client offers.
 */

const { CsvReader } = require('../csvReader');

const reader = new CsvReader();

class PlayerThumbnails {
  get_thumbnails_id() {
    const thumbnailsId = [];
    const rowData = reader.readCsv('assets/csv-logic/playerThumbnails.csv');
    rowData.forEach((row) => thumbnailsId.push(rowData.indexOf(row)));
    return thumbnailsId;
  }
}

module.exports = { PlayerThumbnails };