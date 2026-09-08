/**
 * AVAILABLE SERVER COMMAND  (24111) — the envelope for server->client turn
 * commands (CommandEffects: avatar rename, creator code, box rewards…). It
 * writes the command's type id, then lets that command's encode() write its
 * args — all against THIS writer, so an effect is "a command riding a command
 * message".
 *
 * Optional 4th ctor arg `db` threads the repo handle through to encode() —
 * command.prototype.encode.call(this) runs with `this` = THIS message, so box
 * rolling inside LogicGiveDeliveryItemsCommand reaches `this.db` without the
 * player ever holding a repo reference.
 */

const { ServerMessage } = require('./serverMessage');
const { log } = require('../../../utils/logger');

class AvailableServerCommandMessage extends ServerMessage {
  constructor(client, player, command, db) {
    super(client, player);
    this.id = 24111;
    this.command = command;
    this.db = db;
  }

  encode() {
    if (!this.command) {
      log('[AvailableServerCommand::] Command must not be null');
    }
    this.writeVInt(this.command.prototype.getCommandType.call(this));
    this.command.prototype.encode.call(this);
  }
}

module.exports = { AvailableServerCommandMessage };