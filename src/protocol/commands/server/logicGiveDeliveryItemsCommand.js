/**
 * GIVE DELIVERY ITEMS  (server command 203) — the reward cabinet behind every
 * "you got stuff" moment. Delivery type 100 = the precompiled offer/reward
 * list from the requesting command; any other type = a box, whose contents are
 * ROLLED HERE by LogicBoxData.randomize (tier 10/11/12) and immediately
 * persisted. Payload ends with the standard delivery trailer fields.
 */

const { LogicBoxData } = require('../../../logic/home/logicBoxData');

class LogicGiveDeliveryItemsCommand {
  encode() {
    if (JSON.stringify(this.player.delivery_items['DeliveryTypes']) !== '[100]') {
      this.player.delivery_items['DeliveryTypes'] = this.player.delivery_items['DeliveryTypes'].slice().reverse();
    }

    this.writeVInt(0);
    this.writeVInt(this.player.delivery_items['DeliveryTypes'].length);

    for (const y of this.player.delivery_items['DeliveryTypes']) {
      this.writeVInt(y);
      let rewards;
      if (y !== 100) {
        rewards = LogicBoxData.randomize(this, y)['Rewards'];
      } else {
        rewards = this.player.delivery_items['Items'];
      }

      this.writeVInt(rewards.length);

      for (const x of rewards) {
        const dataRef = x['DataRef'] !== undefined ? x['DataRef'] : [0, 0];
        const itemID = x['ItemID'] !== undefined ? x['ItemID'] : [0, 0];
        const spgID = x['SPGID'] !== undefined ? x['SPGID'] : [0, 0];
        this.writeVInt(x['Amount']);
        this.writeDataReference(dataRef[0], dataRef[1]);
        this.writeVInt(x['Value']);
        this.writeDataReference(itemID[0], itemID[1]);
        this.writeDataReference(spgID[0], spgID[1]);
        this.writeVInt(0);
      }
    }

    this.writeBoolean(true);

    this.writeVInt(1);
    this.writeVInt(1);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeLogicLong(0);
  }

  getCommandType() {
    return 203;
  }
}

module.exports = { LogicGiveDeliveryItemsCommand };