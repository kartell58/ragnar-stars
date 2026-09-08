/**
 * Shop configuration for OwnHomeData: gem/gold packs, brawl boxes, the token
 * doubler and the row of special offers. All prices/amounts come from
 * config/shop.json (loaded once at module start); encode* functions replay the
 * exact wire layout the client's shop tab expects. `offer background` strings
 * and display ids can be tweaked in the JSON without touching this code.
 */

const fs = require('node:fs');
const { rootPath } = require('../../utils/paths');

const LogicShopData = {
  shop_resources: null,
  gold_packs: null,
  gold_cost: [],
  gold_amount: [],
  boxes: null,
  token_doubler: null,
  gems_packs: null,
  gems_cost: [],
  gems_amount: [],
  offers: null,

  init() {
    this.shop_resources = JSON.parse(fs.readFileSync(rootPath('config/shop.json'), 'utf-8'));
    this.gold_packs = this.shop_resources['GoldPacks'];
    for (const x of this.gold_packs) {
      this.gold_cost.push(x['Cost']);
      this.gold_amount.push(x['Amount']);
    }
    this.boxes = this.shop_resources['Boxes'];
    this.token_doubler = this.shop_resources['TokenDoubler'];
    this.gems_packs = this.shop_resources['GemsPacks'];
    for (const x of this.gems_packs) {
      this.gems_cost.push(x['Cost']);
      this.gems_amount.push(x['Amount']);
    }
    this.offers = this.shop_resources['Offers'];
  },

  encodeShopPacks(self) {
    self.writeArrayVint(LogicShopData.gems_cost);
    self.writeArrayVint(LogicShopData.gems_amount);
    self.writeArrayVint([10, 30, 80]);
    self.writeArrayVint([6, 20, 60]);
    self.writeArrayVint(LogicShopData.gold_cost);
    self.writeArrayVint(LogicShopData.gold_amount);
  },

  encodeShopResources(self) {
    self.writeVInt(Math.floor(Date.now() / 1000));
    LogicShopData.encodeBoxes(self);
    LogicShopData.encodeTokenDoubler(self);
  },

  encodeShopOffers(self) {
    self.writeVInt(LogicShopData.offers.length);
    for (const x of LogicShopData.offers) {
      self.writeVInt(x['Items'].length);
      for (const y of x['Items']) {
        self.writeVInt(y['OfferID']);
        self.writeVInt(y['Amount'] !== undefined ? y['Amount'] : 1);
        const cd = y['CharacterID'] !== undefined ? y['CharacterID'] : [0, 0];
        self.writeDataReference(cd[0], cd[1]);
        self.writeVInt(y['ItemID'] !== undefined ? y['ItemID'] : 0);
      }
      self.writeVInt(x['Currency'] !== undefined ? x['Currency'] : 0);
      self.writeVInt(x['Cost']);
      self.writeVInt(x['Timer'] !== undefined ? x['Timer'] : 0);
      self.writeVInt(1);
      self.writeVInt(100);
      self.writeUInt8(0);
      self.writeUInt8(0);
      self.writeVInt(x['ShopDisplay'] !== undefined ? x['ShopDisplay'] : 0);
      self.writeUInt8(0);
      self.writeVInt(0);
      self.writeInt(0);
      self.writeStringReference(x['Title'] !== undefined ? x['Title'] : 'SPECIAL OFFER');
      self.writeUInt8(0);
      self.writeString(x['OfferBackground'] !== undefined ? x['OfferBackground'] : null);
      self.writeVInt(0);
      self.writeUInt8(0);
    }
  },

  encodeBoxes(self) {
    self.writeVInt(100);
    self.writeVInt(10);
    self.writeVInt(LogicShopData.boxes[0]['Cost']);
    self.writeVInt(LogicShopData.boxes[0]['Multiplier']);
    self.writeVInt(LogicShopData.boxes[1]['Cost']);
    self.writeVInt(LogicShopData.boxes[1]['Multiplier']);
  },

  encodeTokenDoubler(self) {
    self.writeVInt(LogicShopData.token_doubler[0]['Cost']);
    self.writeVInt(LogicShopData.token_doubler[0]['Amount']);
  },
};
LogicShopData.init();

module.exports = { LogicShopData };