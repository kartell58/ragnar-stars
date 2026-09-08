/**
 * ADD FRIEND  (10502) — send a friend request to player `low_id`. Delegates to
 * friendHelper (shared by the club variant) which records the pending state on
 * both sides and notifies the target when online.
 */

const { ClientMessage } = require('./clientMessage');
const { add_friend_request } = require('./friendHelper');

class AddFriendMessage extends ClientMessage {
  decode() {
    this.high_id = this.readInt();
    this.low_id = this.readInt();
  }

  process(ctx) {
    const { db } = ctx;
    add_friend_request(this, db, this.low_id);
  }
}

module.exports = { AddFriendMessage };