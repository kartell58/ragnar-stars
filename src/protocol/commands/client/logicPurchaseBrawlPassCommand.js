/**
 * PURCHASE BRAWL PASS  (turn) — activate the premium track; only the
 * BrawlPassActivated flag is toggled (no gem charge yet).
 */

class LogicPurchaseBrawlPassCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
  }

  process(ctx) {
    const { db } = ctx;
    this.player.bp_activated = true;
    db.update_player_account(this.player.token, 'BrawlPassActivated', this.player.bp_activated);
  }
}

module.exports = { LogicPurchaseBrawlPassCommand };