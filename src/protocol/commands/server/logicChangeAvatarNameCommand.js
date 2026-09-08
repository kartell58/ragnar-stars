/**
 * CHANGE AVATAR NAME  (server command 201) — success effect for a rename:
 * echoes the new name (flag 1 = confirmed) so every screen updates.
 */

class LogicChangeAvatarNameCommand {
  encode() {
    this.writeString(this.player.name);
    this.writeVInt(1);
  }

  getCommandType() {
    return 201;
  }
}

module.exports = { LogicChangeAvatarNameCommand };