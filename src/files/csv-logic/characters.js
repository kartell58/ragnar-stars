/**
 * Characters sheet queries (assets/csv-logic/characters.csv). Maps CSV
 * rows to brawler ids: get_brawlers_id() lists the playable heroes (the "Hero"
 * class column, excluding the hidden/test rows), and get_brawler_by_skin_id()
 * walks skin -> skinConf -> character to answer "which brawler owns this
 * skin" for the profile/equip flows.
 */

const { CsvReader } = require('../csvReader');

const reader = new CsvReader();

class Characters {
  get_brawlers_id() {
    const brawlersId = [];
    const rowData = reader.readCsv('assets/csv-logic/characters.csv');
    rowData.forEach((row) => {
      if (row[20] === 'Hero' && String(row[2]).toLowerCase() !== 'true' && String(row[1]).toLowerCase() !== 'true') {
        brawlersId.push(rowData.indexOf(row));
      }
    });
    return brawlersId;
  }

  get_brawler_by_skin_id(skin_id) {
    const charsData = reader.readCsv('assets/csv-logic/characters.csv');
    const skinsData = reader.readCsv('assets/csv-logic/skins.csv');
    const skinsConfsData = reader.readCsv('assets/csv-logic/skinConfs.csv');
    for (const row of skinsData) {
      if (skinsData.indexOf(row) === skin_id) {
        const conf = row[1];
        for (const confRow of skinsConfsData) {
          if (confRow[0] === conf) {
            const brawler = confRow[1];
            for (const charRow of charsData) {
              if (charRow[0] === brawler) return charsData.indexOf(charRow);
            }
          }
        }
      }
    }
  }
}

module.exports = { Characters };