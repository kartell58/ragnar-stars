/**
 * FRIEND LIST UPDATE  (20106) — a single-entry friend-list delta pushed LIVE
 * to the other player's socket (e.g. right after they accept a request), so
 * their screen updates without a full refresh.
 */

const { ServerMessage } = require('./serverMessage');

class FriendListUpdateMessage extends ServerMessage {
  constructor(client, player, db, friend_id, state) {
    super(client, player);
    this.id = 20106;
    this.db = db;
    this.friend_id = friend_id;
    this.state = state;
  }

  encode() {
    const data = this.db.load_player_account_by_id(this.friend_id);
    if (!data) return;

    this.writeVInt(1);

    this.writeInt(0);
    this.writeInt(this.friend_id);
    for (let i = 0; i < 6; i++) this.writeString();
    this.writeInt(data['Trophies']);
    this.writeInt(this.state);
    this.writeInt(0);
    this.writeInt(0);
    this.writeInt(0);
    this.writeBoolean(false);
    this.writeString();
    this.writeInt(0);
    this.writeBoolean(true);
    this.writeString(String(data['Name']));
    this.writeVInt(100);
    this.writeVInt(28000000 + parseInt(data['ProfileIcon'], 10));
    this.writeVInt(43000000 + parseInt(data['NameColor'], 10));
  }
}

module.exports = { FriendListUpdateMessage };