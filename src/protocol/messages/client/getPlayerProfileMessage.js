/**
 * GET PLAYER PROFILE  (14113) — "view this player's card" for the given
 * account id; resolves the target row and answers with a PlayerProfileMessage
 * (any account — friend lookup, battle result screen, club roster).
 */

const { ClientMessage } = require('./clientMessage');
const { PlayerProfileMessage } = require('../server/playerProfileMessage');

class GetPlayerProfileMessage extends ClientMessage {
  decode() {
    this.account_id = this.readLong();
  }

  process(ctx) {
    const { db } = ctx;
    const account_data = db.load_player_account_by_id(this.account_id);
    ctx.reply(PlayerProfileMessage, account_data, db);
  }
}

module.exports = { GetPlayerProfileMessage };