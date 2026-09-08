/**
 * SET NAME  (10212)
 *
 * The client requests a display-name change. Validation lives on the SERVER
 * (the client UI already trims, but the wire is not trusted): a name in the
 * 2..20 char range is persisted (Name + NameSet) and echoed back to the world
 * through a CommandEffect (LogicChangeAvatarNameCommand); anything else — too
 * short, too long, or empty — gets AvatarNameChangeFailed with no state
 * changed. That asymmetry is what forces the client's name prompt to stay
 * closed after a failed attempt instead of looping.
 */

const { ClientMessage } = require('./clientMessage');

class SetNameMessage extends ClientMessage {
  decode() {
    this.username = this.readString();
    this.state = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    const { AvailableServerCommandMessage } = require('../server/availableServerCommandMessage');
    const { AvatarNameChangeFailedMessage } = require('../server/avatarNameChangeFailedMessage');
    const { LogicChangeAvatarNameCommand } = require('../../commands/server/logicChangeAvatarNameCommand');

    if (this.username !== '') {
      if (this.username.length >= 2 && this.username.length <= 20) {
        this.player.name = this.username;
        db.update_player_account(this.player.token, 'Name', this.username);
        db.update_player_account(this.player.token, 'NameSet', true);
        ctx.reply(AvailableServerCommandMessage, LogicChangeAvatarNameCommand);
      } else {
        ctx.reply(AvatarNameChangeFailedMessage);
      }
    } else {
      ctx.reply(AvatarNameChangeFailedMessage);
    }
  }
}

module.exports = { SetNameMessage };