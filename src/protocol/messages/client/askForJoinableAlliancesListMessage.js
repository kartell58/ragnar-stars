/**
 * ASK FOR JOINABLE ALLIANCES  (14303) — the club search tab's default feed:
 * every club sorted by trophies, highest first, as a JoinableAllianceList.
 */

const { ClientMessage } = require('./clientMessage');
const { JoinableAllianceListMessage } = require('../server/joinableAllianceListMessage');

class AskForJoinableAlliancesListMessage extends ClientMessage {
  decode() {}

  process(ctx) {
    const { db } = ctx;
    const clubs = db.load_all_clubs_sorted({}, 'Trophies');
    clubs.reverse();

    ctx.reply(JoinableAllianceListMessage, clubs);
  }
}

module.exports = { AskForJoinableAlliancesListMessage };