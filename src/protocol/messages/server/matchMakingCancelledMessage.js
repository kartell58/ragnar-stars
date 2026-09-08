/**
 * MATCHMAKING CANCELLED  (20406) — empty ack that stops the client's
 * "searching for a match" spinner (sent when a match is found/started).
 */

const { ServerMessage } = require('./serverMessage');

class MatchMakingCancelledMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 20406;
  }

  encode() {}
}

module.exports = { MatchMakingCancelledMessage };