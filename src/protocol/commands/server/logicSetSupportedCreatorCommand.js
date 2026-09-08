/**
 * SET SUPPORTED CREATOR  (server command 215) — success effect for the creator
 * code: echoes the accepted code back with flag 1.
 */

class LogicSetSupportedCreatorCommand {
  encode() {
    this.writeVInt(1);
    this.writeString(this.player.content_creator);
    this.writeVInt(1);
  }

  getCommandType() {
    return 215;
  }
}

module.exports = { LogicSetSupportedCreatorCommand };