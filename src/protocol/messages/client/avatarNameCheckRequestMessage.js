/**
 * AVATAR NAME CHECK  (14600) — the rename field's "is this taken?" probe. The
 * server does no collision check yet: it echoes a free-name response so the
 * input never blocks (the real enforcement happens at SetName).
 */

const { ClientMessage } = require('./clientMessage');
const { AvatarNameCheckResponseMessage } = require('../server/avatarNameCheckResponseMessage');

class AvatarNameCheckRequestMessage extends ClientMessage {
  decode() {
    this.username = this.readString();
  }

  process() {
    new AvatarNameCheckResponseMessage(this.client, this.player, this.username).send();
  }
}

module.exports = { AvatarNameCheckRequestMessage };