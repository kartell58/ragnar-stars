/**
 * TEAM LEFT  (24125) — confirmation that the party is closed for this player
 * (sent after leave, its single zero closes the party screen cleanly).
 */

const { ServerMessage } = require('./serverMessage');

class TeamLeftMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 24125;
  }

  encode() {
    this.writeInt(0);
  }
}

module.exports = { TeamLeftMessage };