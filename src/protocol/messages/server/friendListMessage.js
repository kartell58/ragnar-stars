/**
 * FRIEND LIST  (20105) — the friends tab. Streams one card per friendship
 * entry (trophies, state 1=request/4=confirmed, name, icon/name-color ids),
 * and finishes each entry with a FriendOnlineStatusEntry so the client shows
 * who is online right now. Friends whose account rows vanished are skipped.
 */

const { ServerMessage } = require('./serverMessage');
const { Helpers } = require('../../../utils/helpers');
const { FriendOnlineStatusEntryMessage } = require('./friendOnlineStatusEntryMessage');

class FriendListMessage extends ServerMessage {
  constructor(client, player, db) {
    super(client, player);
    this.id = 20105;
    this.db = db;
  }

  encode() {
    const friends = [];
    for (const friend of this.player.friends) {
      const data = this.db.load_player_account_by_id(friend['id']);
      if (data) friends.push([friend, data]);
    }

    this.writeInt(0);
    this.writeBoolean(true);
    this.writeInt(friends.length);

    for (const [friend, data] of friends) {
      this.writeInt(0);
      this.writeInt(friend['id']);
      for (let i = 0; i < 6; i++) this.writeString();
      this.writeInt(data['Trophies']);
      this.writeInt(friend['state']);
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

      const entry = Helpers.connected_clients['Clients'][String(friend['id'])];
      const status = entry ? entry['Player'].status : 0;
      new FriendOnlineStatusEntryMessage(this.client, friend['id'], status).send();
    }
  }
}

module.exports = { FriendListMessage };