/**
 * GATCHA  (turn) — buy/open a shop box: charges gems for box 1/3 (costs from
 * config/shop.json) and delivers the box as a LogicGiveDeliveryItems command,
 * whose rewards are rolled by LogicBoxData when encoded.
 */

const { Helpers } = require('../../../utils/helpers');
const { LogicShopData } = require('../../../logic/home/logicShopData');
const { AvailableServerCommandMessage } = require('../../messages/server/availableServerCommandMessage');
const { LogicGiveDeliveryItemsCommand } = require('../server/logicGiveDeliveryItemsCommand');

class LogicGatchaCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.box_id = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    this.player.delivery_items = { Count: 1, DeliveryTypes: [Helpers.get_box_type(this.box_id)] };

    if (this.box_id === 1) {
      this.player.gems = this.player.gems - LogicShopData.boxes[0]['Cost'];
      db.update_player_account(this.player.token, 'Gems', this.player.gems);
    } else if (this.box_id === 3) {
      this.player.gems = this.player.gems - LogicShopData.boxes[1]['Cost'];
      db.update_player_account(this.player.token, 'Gems', this.player.gems);
    }

    new AvailableServerCommandMessage(this.client, this.player, LogicGiveDeliveryItemsCommand, db).send();
  }
}

module.exports = { LogicGatchaCommand };