/**
 * AVATAR NAME CHANGE FAILED  (20205) — sent when a rename is rejected (too
 * short / too long / empty). The single zero vint leaves the previous name
 * untouched and the rename box closed.
 */

const { ServerMessage } = require('./serverMessage');

class AvatarNameChangeFailedMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 20205;
  }

  encode() {
    this.writeVInt(0);
  }
}

module.exports = { AvatarNameChangeFailedMessage };