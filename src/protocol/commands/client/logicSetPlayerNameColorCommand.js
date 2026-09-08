/**
 * SET PLAYER NAME COLOR  (turn) — change the name tint (data reference → id
 * family 43000000+); only the NameColor field persists.
 */

class LogicSetPlayerNameColorCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.player.name_color = this.readDataReference()[1];
  }

  process(ctx) {
    const { db } = ctx;
    db.update_player_account(this.player.token, 'NameColor', this.player.name_color);
  }
}

module.exports = { LogicSetPlayerNameColorCommand };