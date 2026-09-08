/**
 * SET SUPPORTED CREATOR RESPONSE  (28686) — rejection reply for the creator
 * code (unknown code): flag 1 + the current (unchanged) creator so the client
 * keeps the previous credit.
 */

const { ServerMessage } = require('./serverMessage');

class SetSupportedCreatorResponseMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 28686;
  }

  encode() {
    this.writeVInt(1);
    this.writeString(this.player.content_creator);
  }
}

module.exports = { SetSupportedCreatorResponseMessage };