/**
 * SEND CLUB FRIEND  (14326) — same intent as ADD FRIEND but fired from the
 * club roster screen; identical path through friendHelper.
 */

const { ClientMessage } = require('./clientMessage');
const { add_friend_request } = require('./friendHelper');

class SendClubFriendMessage extends ClientMessage {
  decode() {
    this.high_id = this.readInt();
    this.low_id = this.readInt();
  }

  process(ctx) {
    const { db } = ctx;
    add_friend_request(this, db, this.low_id);
  }
}

module.exports = { SendClubFriendMessage };