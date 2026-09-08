/**
 * PLAYER STATUS  (14366) — the client broadcasts its screen state (lobby,
 * team, in-match…). Only meaningful transitions move the server-side status;
 * the 0xFFFFFFFF sentinel is folded into 8 (in-match) so battle-end gates work
 * uniformly.
 */

const { ClientMessage } = require('./clientMessage');

class PlayerStatusMessage extends ClientMessage {
  constructor(client, player, initialBytes) {
    super(client, player, initialBytes);
    this.status = 0;
  }

  decode() {
    this.status = this.readVInt();
  }

  process() {
    if (this.status === this.player.status) return;
    if (this.status === 4294967295) this.status = 8;

    this.player.status = this.status;
  }
}

module.exports = { PlayerStatusMessage };