/**
 * FRIEND ONLINE STATUS ENTRY  (24555) — the small "online/offline" chip
 * emitted per friend (wired to player status 0=lobby, 8=in-match…). Carries no
 * player context (player=null): it piggybacks on someone else's socket.
 */

const { ServerMessage } = require('./serverMessage');

class FriendOnlineStatusEntryMessage extends ServerMessage {
  constructor(client, low_id, status) {
    super(client, null);
    this.id = 24555;
    this.low_id = low_id;
    this.status = status;
  }

  encode() {
    this.writeInt(0);
    this.writeInt(this.low_id);
    this.writeBoolean(true);
    this.writeInt(0);
    this.writeInt(this.low_id);
    this.writeVInt(this.status);
    this.writeVInt(0);
    this.writeBoolean(false);
    this.writeBoolean(false);
  }
}

module.exports = { FriendOnlineStatusEntryMessage };