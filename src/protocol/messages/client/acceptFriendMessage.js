/**
 * ACCEPT FRIEND  (10501) — confirms a pending request: both friendship entries
 * flip to state 4 and persist, the online target gets a live FriendListUpdate
 * push, and the acceptor re-receives the full friend list.
 */

const { ClientMessage } = require('./clientMessage');
const { Helpers } = require('../../../utils/helpers');
const { FriendListMessage } = require('../server/friendListMessage');
const { FriendListUpdateMessage } = require('../server/friendListUpdateMessage');

class AcceptFriendMessage extends ClientMessage {
  decode() {
    this.high_id = this.readInt();
    this.low_id = this.readInt();
  }

  process(ctx) {
    const { db } = ctx;
    const friend_id = this.low_id;

    for (const friend of this.player.friends) {
      if (friend['id'] === friend_id) friend['state'] = 4;
    }
    db.update_player_account(this.player.token, 'Friends', this.player.friends);

    const target = db.load_player_account_by_id(friend_id);
    if (target) {
      for (const friend of target['Friends']) {
        if (friend['id'] === this.player.ID) friend['state'] = 4;
      }
      db.update_player_account(target['Token'], 'Friends', target['Friends']);

      const entry = Helpers.connected_clients['Clients'][String(friend_id)];
      if (entry) {
        try {
          new FriendListUpdateMessage(
            entry['SocketInfo'],
            entry['Player'],
            db,
            this.player.ID,
            4
          ).send();
        } catch (e) {
          // pass
        }
      }
    }

    ctx.reply(FriendListMessage, db);
  }
}

module.exports = { AcceptFriendMessage };