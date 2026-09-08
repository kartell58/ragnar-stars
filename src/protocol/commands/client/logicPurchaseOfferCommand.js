/**
 * PURCHASE OFFER  (turn) — buy a shop offer by index. Each offer item's
 * OfferID maps to a reward type: 1/9 gold/token-doubler, 16 gems, 3 brawler,
 * 4 skin, 12/8 power points, 0/6/10/14 box deliveries (10/11/12 = tier)…
 * Rewards are compiled into a delivery_items payload, granted (and persisted)
 * immediately, the cost is charged from gems/gold/star tokens, then the whole
 * batch is echoed as LogicGiveDeliveryItemsCommand. Already-claimed offers are
 * ignored.
 */

const { LogicShopData } = require('../../../logic/home/logicShopData');
const { AvailableServerCommandMessage } = require('../../messages/server/availableServerCommandMessage');
const { LogicGiveDeliveryItemsCommand } = require('../server/logicGiveDeliveryItemsCommand');

class LogicPurchaseOfferCommand {
  constructor() {
    this.offer_index = 0;
    this.brawler = 0;
  }

  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();

    this.offer_index = this.readVInt();

    this.brawler = this.readDataReference()[1];
  }

  process(ctx) {
    const { db, log } = ctx;
    const offer_resource = LogicShopData.offers[this.offer_index]['Currency'] !== undefined
      ? LogicShopData.offers[this.offer_index]['Currency']
      : 0;
    const offer_cost = LogicShopData.offers[this.offer_index]['Cost'];

    if (!LogicShopData.offers[this.offer_index]['Claimed']) {
      this.player.delivery_items = {
        DeliveryTypes: [100],
        Items: [],
      };

      for (const item of LogicShopData.offers[this.offer_index]['Items']) {
        if (item['OfferID'] === 1) {
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, Value: 7 };
          this.player.delivery_items['Items'].push(delivery);
          this.player.resources[1]['Amount'] += item['Amount'] !== undefined ? item['Amount'] : 1;
          db.update_player_account(this.player.token, 'Resources', this.player.resources);
        } else if (item['OfferID'] === 4) {
          const delivery = { Amount: 1, Value: 9, ItemID: [29, item['ItemID'] !== undefined ? item['ItemID'] : 0] };
          this.player.delivery_items['Items'].push(delivery);

          if (!this.player.unlocked_skins.includes(delivery['ItemID'][1])) {
            this.player.unlocked_skins.push(delivery['ItemID'][1]);
            db.update_player_account(this.player.token, 'UnlockedSkins', this.player.unlocked_skins);
          }
        } else if (item['OfferID'] === 16) {
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, Value: 8 };
          this.player.delivery_items['Items'].push(delivery);

          this.player.gems += item['Amount'] !== undefined ? item['Amount'] : 1;
          db.update_player_account(this.player.token, 'Gems', this.player.gems);
        } else if (item['OfferID'] === 9) {
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, DataRef: [0, 0], Value: 2 };
          this.player.delivery_items['Items'].push(delivery);

          this.player.token_doubler = this.player.token_doubler + (item['Amount'] !== undefined ? item['Amount'] : 1);
          db.update_player_account(this.player.token, 'TokenDoubler', this.player.token_doubler);
        } else if (item['OfferID'] === 3) {
          const cd = item['CharacterID'] !== undefined ? item['CharacterID'] : [16, 0];
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, DataRef: cd, Value: 1 };
          this.player.delivery_items['Items'].push(delivery);
          if (!this.player.brawlers_unlocked.some((b) => JSON.stringify(b) === JSON.stringify(delivery['DataRef']))) {
            this.player.brawlers_unlocked.push(delivery['DataRef']);
            db.update_player_account(this.player.token, 'UnlockedBrawlers', this.player.brawlers_unlocked);
          }
        } else if (item['OfferID'] === 12) {
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, DataRef: [16, this.brawler], Value: 6 };
          this.player.delivery_items['Items'].push(delivery);

          this.player.brawlers_powerpoints[String(this.brawler)] = item['Amount'] !== undefined ? item['Amount'] : 1;
          db.update_player_account(this.player.token, 'BrawlersPowerPoints', this.player.brawlers_powerpoints);
        } else if (item['OfferID'] === 8) {
          const cd = item['CharacterID'] !== undefined ? item['CharacterID'] : [16, 0];
          const delivery = { Amount: item['Amount'] !== undefined ? item['Amount'] : 1, DataRef: cd, Value: 6 };
          this.player.delivery_items['Items'].push(delivery);

          this.player.brawlers_powerpoints[String(cd)] += item['Amount'] !== undefined ? item['Amount'] : 1;
          db.update_player_account(this.player.token, 'BrawlersPowerPoints', this.player.brawlers_powerpoints);
        } else if (item['OfferID'] === 0 || item['OfferID'] === 6) {
          for (let i = 0; i < item['Amount']; i++) this.player.delivery_items['DeliveryTypes'].push(10);
          this.player.delivery_items['Count'] = item['Amount'] !== undefined ? item['Amount'] : 1;
        } else if (item['OfferID'] === 14) {
          for (let i = 0; i < item['Amount']; i++) this.player.delivery_items['DeliveryTypes'].push(12);
          this.player.delivery_items['Count'] = item['Amount'] !== undefined ? item['Amount'] : 1;
        } else if (item['OfferID'] === 10) {
          for (let i = 0; i < item['Amount']; i++) this.player.delivery_items['DeliveryTypes'].push(11);
          this.player.delivery_items['Count'] = item['Amount'] !== undefined ? item['Amount'] : 1;
        } else {
          log(`Unsupported offer ID: ${item['OfferID']}`);
        }
      }

      if (offer_resource === 0) {
        this.player.gems -= offer_cost;
        db.update_player_account(this.player.token, 'Gems', this.player.gems);
      } else if (offer_resource === 1) {
        this.player.resources[1]['Amount'] -= offer_cost;
        db.update_player_account(this.player.token, 'Resources', this.player.resources);
      } else if (offer_resource === 3) {
        this.player.resources[3]['Amount'] -= offer_cost;
        db.update_player_account(this.player.token, 'Resources', this.player.resources);
      }

      new AvailableServerCommandMessage(this.client, this.player, LogicGiveDeliveryItemsCommand, db).send();
    }
  }
}

module.exports = { LogicPurchaseOfferCommand };