/**
 * PURCHASE DOUBLE COINS  (turn) — buy the token doubler booster: spends gems
 * (config/shop.json TokenDoubler cost) for the doubler amount.
 */

const { LogicShopData } = require('../../../logic/home/logicShopData');

class LogicPurchaseDoubleCoinsCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
  }

  process(ctx) {
    const { db } = ctx;
    this.player.token_doubler = this.player.token_doubler + LogicShopData.token_doubler[0]['Amount'];
    db.update_player_account(this.player.token, 'TokenDoubler', this.player.token_doubler);

    this.player.gems = this.player.gems - LogicShopData.token_doubler[0]['Cost'];
    db.update_player_account(this.player.token, 'Gems', this.player.gems);
  }
}

module.exports = { LogicPurchaseDoubleCoinsCommand };