/**
 * SEARCH ALLIANCES  (14324) — case-insensitive name filter over all clubs;
 * the matches (with the query echoed back) come through AllianceListMessage.
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceListMessage } = require('../server/allianceListMessage');

class SearchAlliancesMessage extends ClientMessage {
  decode() {
    this.query = this.readString();
  }

  process(ctx) {
    const { db } = ctx;
    const result = [];
    const clubs = db.load_all_clubs({});

    for (const club of clubs) {
      if (String(club['Name']).toLowerCase().includes(this.query.toLowerCase())) {
        result.push(club);
      }
    }

    ctx.reply(AllianceListMessage, this.query, result);
  }
}

module.exports = { SearchAlliancesMessage };