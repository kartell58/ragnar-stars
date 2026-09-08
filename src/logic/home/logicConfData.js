/**
 * Home "config data" blob appended to OwnHomeData. Hard-coded, largely dummy
 * values the client needs to stay happy: shop resources+packs (LogicShopData),
 * the event feed (LogicEventData), and the personalization list (theme id ->
 * 41000000+ theme reference). The layout/order matters — replay the fields in
 * exactly this sequence.
 */

const { LogicEventData } = require('./logicEventData');
const { LogicShopData } = require('./logicShopData');

class LogicConfData {
  static encode(self) {
    LogicShopData.encodeShopResources(self);

    self.writeVInt(500);
    self.writeVInt(50);
    self.writeVInt(999900);

    self.writeArrayVint([]);

    LogicEventData.encode(self);

    LogicShopData.encodeShopPacks(self);

    self.writeVInt(0);
    self.writeVInt(200);
    self.writeVInt(20);
    self.writeVInt(0);
    self.writeVInt(10);
    self.writeVInt(0);
    self.writeVInt(0);
    self.writeVInt(0);
    self.writeVInt(0);
    self.writeUInt8(1);

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeDataReference(16, 0);
      self.writeInt(99999);
      self.writeInt(0);
    }

    self.writeVInt(1);
    for (let x = 0; x < 1; x++) {
      self.writeInt(1);
      self.writeInt(41000000 + self.player.theme_id);
    }

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeVInt(0);
      self.writeVInt(0);
      self.writeVInt(0);
      self.writeVInt(0);
    }
  }
}

module.exports = { LogicConfData };