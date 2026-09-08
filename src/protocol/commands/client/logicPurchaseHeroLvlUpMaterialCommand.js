/**
 * PURCHASE HERO LVL-UP MATERIAL  (turn) — buy gold with gems: adds the chosen
 * gold pack amount to resources and subtracts its gem cost.
 */

const { LogicShopData } = require('../../../logic/home/logicShopData');

class LogicPurchaseHeroLvlUpMaterialCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.gold_value = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    const gold_pack = this.gold_value >= 0 && this.gold_value < LogicShopData.gold_packs.length
      ? LogicShopData.gold_packs[this.gold_value]
      : LogicShopData.gold_packs[0];

    this.player.resources[1]['Amount'] = this.player.resources[1]['Amount'] + gold_pack['Amount'];
    db.update_player_account(this.player.token, 'Resources', this.player.resources);

    this.player.gems = this.player.gems - gold_pack['Cost'];
    db.update_player_account(this.player.token, 'Gems', this.player.gems);
  }
}

module.exports = { LogicPurchaseHeroLvlUpMaterialCommand };