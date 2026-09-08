/**
 * KEEP ALIVE OK  (20108) — empty acknowledgement for the client heartbeat; its
 * very emptiness proves the connection is alive (zero payload, just the frame
 * header + trailer).
 */

const { ServerMessage } = require('./serverMessage');

class KeepAliveOkMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 20108;
  }

  encode() {}
}

module.exports = { KeepAliveOkMessage };