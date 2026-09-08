/**
 * END CLIENT TURN  (14102) — the envelope for turn commands (purchase, level
 * up, box open…). decode() reads tick/checksum then N command ids: known
 * CLIENT-side commands are decoded through their command class; server-side
 * command ids ([200,500)) are skipped by design (they travel the other way);
 * unknown or unhandled ones are logged and drained. process() then replays each
 * decoded command's process(ctx) using THIS message as the shared context and
 * the router's per-request toolbox as the argument.
 */

const { ClientMessage } = require('./clientMessage');

class EndClientTurnMessage extends ClientMessage {
  constructor(client, player, initialBytes) {
    super(client, player, initialBytes);
    this.tick = 0;
    this.checksum = 0;
    this.commands = [];
  }

  decode() {
    const { LogicCommandManager } = require('../../logicCommandManager');
    const { log } = require('../../../utils/logger');

    this.readVInt();
    this.tick = this.readVInt();
    this.checksum = this.readVInt();

    const count = this.readVInt();
    for (let x = 0; x < count; x++) {
      const commandID = this.readVInt();
      this.commands.push({ id: commandID });

      if (LogicCommandManager.commandExists(commandID)) {
        if (LogicCommandManager.isServerToClient(commandID)) continue;
        const command = LogicCommandManager.createCommandByType(commandID);
        if (command) {
          this.commands[x]['cls'] = command;
          command.prototype.decode.call(this);
          log(`CommandID: ${commandID}, ${command.name} handled!`);
        } else {
          this.readVInt();
          this.readVInt();
          this.readLogicLong();
          log(`CommandID: ${commandID}, ${LogicCommandManager.getCommandName(commandID)} unhandled!`);
        }
      } else {
        log(`CommandID: ${commandID} unhandled!`);
      }
    }
  }

  process(ctx) {
    if (!this.commands.length) return;

    for (const cmd of this.commands) {
      if (!('cls' in cmd)) return;

      if (typeof cmd.cls.prototype.process === 'function') {
        cmd.cls.prototype.process.call(this, ctx);
      }
    }
  }
}

module.exports = { EndClientTurnMessage };