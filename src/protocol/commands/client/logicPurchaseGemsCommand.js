/**
 * PURCHASE GEMS  (turn) — buy a gems pack (gold-first shop): pays gold
 * (resources[1]) for the pack's gem amount from config/shop.json.
 */

const { LogicShopData } = require('../../../logic/home/logicShopData');

class LogicPurchaseGemsCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.gems_value = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    const gems_pack = this.gems_value >= 0 && this.gems_value < LogicShopData.gems_packs.length
      ? LogicShopData.gems_packs[this.gems_value]
      : LogicShopData.gems_packs[0];

    this.player.resources[1]['Amount'] = this.player.resources[1]['Amount'] - gems_pack['Cost'];
    db.update_player_account(this.player.token, 'Resources', this.player.resources);

    this.player.gems = this.player.gems + gems_pack['Amount'];
    db.update_player_account(this.player.token, 'Gems', this.player.gems);
  }
}

module.exports = { LogicPurchaseGemsCommand };