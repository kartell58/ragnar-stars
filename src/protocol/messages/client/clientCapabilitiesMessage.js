/**
 * CLIENT CAPABILITIES  (10107) — the client announces what it supports
 * (device/filtering flags) right after login. We decode the value and ignore
 * it: accepted so the handshake completes, nothing to act on server-side.
 */

const { ClientMessage } = require('./clientMessage');

class ClientCapabilitiesMessage extends ClientMessage {
  decode() {
    this.capabilities = this.readVInt();
  }

  process() {}
}

module.exports = { ClientCapabilitiesMessage };