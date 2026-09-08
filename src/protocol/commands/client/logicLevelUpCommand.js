/**
 * LEVEL UP  (turn) — spend the level-up material on a brawler: bumps its
 * BrawlersLevel by one and persists.
 */

class LogicLevelUpCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.brawler = this.readDataReference()[1];
  }

  process(ctx) {
    const { db } = ctx;
    this.player.brawlers_level[String(this.brawler)] = this.player.brawlers_level[String(this.brawler)] + 1;
    db.update_player_account(this.player.token, 'BrawlersLevel', this.player.brawlers_level);
  }
}

module.exports = { LogicLevelUpCommand };