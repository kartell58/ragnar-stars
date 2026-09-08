/**
 * SET SUPPORTED CREATOR  (18686) — the "creator code" field. The code is
 * accepted (persisted + CommandEffect) only when it matches a known creator
 * code (or is left blank to clear); anything else gets the failed response so
 * the client keeps its current value.
 */

const { ClientMessage } = require('./clientMessage');
const { AvailableServerCommandMessage } = require('../server/availableServerCommandMessage');
const { SetSupportedCreatorResponseMessage } = require('../server/setSupportedCreatorResponseMessage');
const { LogicSetSupportedCreatorCommand } = require('../../commands/server/logicSetSupportedCreatorCommand');

class SetSupportedCreatorMessage extends ClientMessage {
  decode() {
    this.player.content_creator = this.readString();
  }

  process(ctx) {
    const { db } = ctx;
    if (
      this.player.content_creator_codes.some((c) => this.player.content_creator.toLowerCase() === String(c).toLowerCase())
      || this.player.content_creator === ''
    ) {
      db.update_player_account(this.player.token, 'SupportedContentCreator', this.player.content_creator);
      ctx.reply(AvailableServerCommandMessage, LogicSetSupportedCreatorCommand);
    } else {
      ctx.reply(SetSupportedCreatorResponseMessage);
    }
  }
}

module.exports = { SetSupportedCreatorMessage };