/**
 * CLAIM RANK-UP REWARD  (turn) — the trophy-road milestone chest: delivers one
 * big box (type 5) as a LogicGiveDeliveryItems command.
 */

const { Helpers } = require('../../../utils/helpers');
const { AvailableServerCommandMessage } = require('../../messages/server/availableServerCommandMessage');
const { LogicGiveDeliveryItemsCommand } = require('../server/logicGiveDeliveryItemsCommand');

class LogicClaimRankUpRewardCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.unlock_index = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    this.player.delivery_items = { Count: 1, DeliveryTypes: [Helpers.get_box_type(5)] };
    new AvailableServerCommandMessage(this.client, this.player, LogicGiveDeliveryItemsCommand, db).send();
  }
}

module.exports = { LogicClaimRankUpRewardCommand };