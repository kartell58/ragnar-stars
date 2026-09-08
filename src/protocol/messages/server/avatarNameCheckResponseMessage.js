/**
 * AVATAR NAME CHECK RESPONSE  (20300) — answer to the availability probe:
 * echoes the probed name (availability flag currently hard-zeroed = free).
 */

const { ServerMessage } = require('./serverMessage');

class AvatarNameCheckResponseMessage extends ServerMessage {
  constructor(client, player, username) {
    super(client, player);
    this.id = 20300;
    this.username = username;
  }

  encode() {
    this.writeUInt8(0);
    this.writeInt(0);
    this.writeString(this.username);
  }
}

module.exports = { AvatarNameCheckResponseMessage };