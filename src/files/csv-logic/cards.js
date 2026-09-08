const { CsvReader } = require('../csvReader');

const reader = new CsvReader();

// Pre-computed lookup maps (lazy init)
let _brawlerIdToName = null;
let _cardUnlockByName = null;
let _cardSpgByNameType = null;

function initMaps() {
  if (_brawlerIdToName !== null) return;
  
  const charsData = reader.readCsv('assets/csv-logic/characters.csv');
  const cardsData = reader.readCsv('assets/csv-logic/cards.csv');
  
  _brawlerIdToName = new Map();
  for (let i = 0; i < charsData.length; i++) {
    _brawlerIdToName.set(i, charsData[i][0]);
  }
  
  _cardUnlockByName = new Map();
  _cardSpgByNameType = new Map();
  
  for (let i = 0; i < cardsData.length; i++) {
    const row = cardsData[i];
    const name = row[3];
    const type = String(row[5]).toLowerCase();
    if (type === '0') {
      _cardUnlockByName.set(name, i);
    } else if (type === '4' || type === '5') {
      const key = name + '|' + type;
      if (!_cardSpgByNameType.has(key)) {
        _cardSpgByNameType.set(key, i);
      }
    }
  }
}

class Cards {
  get_spg_id() {
    initMaps();
    const result = [];
    for (const id of _cardSpgByNameType.values()) {
      result.push(id);
    }
    return result;
  }

  check_spg_id(id) {
    initMaps();
    // reverse lookup - not used critically, keep simple
    const cardsData = reader.readCsv('assets/csv-logic/cards.csv');
    if (id >= 0 && id < cardsData.length) {
      return String(cardsData[id][5]).toLowerCase();
    }
  }

  get_brawler_unlock() {
    initMaps();
    return Array.from(_cardUnlockByName.values());
  }

  get_spg_by_brawler_id(brawler_id, type) {
    initMaps();
    const name = _brawlerIdToName.get(brawler_id);
    if (!name) return;
    return _cardSpgByNameType.get(name + '|' + type);
  }

  get_unlock_by_brawler_id(brawler_id) {
    initMaps();
    const name = _brawlerIdToName.get(brawler_id);
    if (!name) return;
    return _cardUnlockByName.get(name);
  }
}

module.exports = { Cards };
