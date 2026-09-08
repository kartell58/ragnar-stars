/**
 * ALLIANCE RESPONSE  (24333) — terse action ack for club operations; `action`
 * carries the opcode (10 settings saved, 20 created, 40 joined, 80 left) that
 * the client toasts.
 */

const { ServerMessage } = require('./serverMessage');

class AllianceResponseMessage extends ServerMessage {
  constructor(client, player, action) {
    super(client, player);
    this.id = 24333;
    this.action = action;
  }

  encode() {
    this.writeVInt(this.action);
  }
}

module.exports = { AllianceResponseMessage };