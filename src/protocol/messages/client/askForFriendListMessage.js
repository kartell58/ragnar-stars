/**
 * ASK FOR FRIEND LIST  (10504) — refresh the friends tab: re-emits the current
 * list (FriendListMessage reasons the states into requests/confirmed/offline
 * buckets client-side).
 */

const { ClientMessage } = require('./clientMessage');
const { FriendListMessage } = require('../server/friendListMessage');

class AskForFriendListMessage extends ClientMessage {
  decode() {}

  process(ctx) {
    ctx.reply(FriendListMessage, ctx.db);
  }
}

module.exports = { AskForFriendListMessage };