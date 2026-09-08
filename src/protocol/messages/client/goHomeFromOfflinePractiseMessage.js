/**
 * GO HOME  (14109) — exit offline practise / training back to the main menu:
 * simply re-sends OwnHomeData, which is the canonical "home rendered" reply.
 */

const { ClientMessage } = require('./clientMessage');
const { OwnHomeDataMessage } = require('../server/ownHomeDataMessage');

class GoHomeFromOfflinePractiseMessage extends ClientMessage {
  decode() {}

  process() {
    new OwnHomeDataMessage(this.client, this.player).send();
  }
}

module.exports = { GoHomeFromOfflinePractiseMessage };