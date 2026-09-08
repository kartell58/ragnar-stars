/**
 * SET PLAYER THUMBNAIL  (turn) — change the profile icon (data reference → id
 * family 28000000+); only the icon field persists.
 */

class LogicSetPlayerThumbnailCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.player.profile_icon = this.readDataReference()[1];
  }

  process(ctx) {
    const { db } = ctx;
    db.update_player_account(this.player.token, 'ProfileIcon', this.player.profile_icon);
  }
}

module.exports = { LogicSetPlayerThumbnailCommand };