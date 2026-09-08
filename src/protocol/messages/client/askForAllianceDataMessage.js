/**
 * ASK FOR ALLIANCE DATA  (14302) — load a club by id (id 0 = own club) and
 * return its full card: badges, roster, settings, message log.
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceDataMessage } = require('../server/allianceDataMessage');

class AskForAllianceDataMessage extends ClientMessage {
  decode() {
    this.club_id = this.readLong();
  }

  process(ctx) {
    const { db } = ctx;
    const club_data = db.load_club(this.club_id);
    ctx.reply(AllianceDataMessage, club_data);
  }
}

module.exports = { AskForAllianceDataMessage };