const { PlayerThumbnails } = require('../../files/csv-logic/playerThumbnails');
const { LogicShopData } = require('./logicShopData');

class LogicDailyData {
  static encode(self) {
    const time_stamp = Math.floor(Date.now() / 1000);

    self.writeVInt(time_stamp);
    self.writeVInt(time_stamp);

    self.writeVInt(self.player.trophies);
    self.writeVInt(self.player.high_trophies);
    self.writeVInt(self.player.high_trophies);

    self.writeVInt(self.player.trophy_reward);
    self.writeVInt(self.player.exp_points);

    self.writeDataReference(28, self.player.profile_icon);
    self.writeDataReference(43, self.player.name_color);

    const unlocked_thumbnails = new PlayerThumbnails().get_thumbnails_id();
    self.writeVInt(unlocked_thumbnails.length);
    for (const x of unlocked_thumbnails) self.writeVInt(x);

    self.writeVInt(Object.keys(self.player.selected_skins).length);
    for (const x of Object.keys(self.player.selected_skins)) {
      self.writeDataReference(29, self.player.selected_skins[x]);
    }

    self.writeVInt(self.player.unlocked_skins.length);
    for (const x of self.player.unlocked_skins) self.writeDataReference(29, x);

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) self.writeDataReference(0, 0);

    self.writeVInt(0);
    self.writeVInt(self.player.high_trophies);
    self.writeVInt(0);

    self.writeUInt8(0);
    self.writeVInt(0);
    self.writeUInt8(0);

    self.writeVInt(self.player.token_doubler);
    self.writeVInt(99999);
    self.writeVInt(0);
    self.writeVInt(99999);

    self.writeVInt(0);

    self.writeBoolean(false);
    self.writeBoolean(false);

    self.writeUInt8(8);

    self.writeVInt(2);
    self.writeVInt(2);
    self.writeVInt(2);

    self.writeVInt(0);
    self.writeVInt(0);

    LogicShopData.encodeShopOffers(self);

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeVInt(0);
      self.writeVInt(0);
      self.writeVInt(0);
    }

    self.writeVInt(200);
    self.writeVInt(0);

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) self.writeVInt(x);

    self.writeVInt(self.player.tickets);
    self.writeVInt(0);

    self.writeDataReference(16, self.player.home_brawler);

    self.writeString(self.player.region);
    self.writeString(self.player.content_creator);

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeInt(0);
      self.writeInt(0);
    }

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeVInt(0);
      self.writeDataReference(0, 0);
      self.writeVInt(0);
    }

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      // pass
    }

    self.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      self.writeVInt(0);
      self.writeVInt(0);
    }

    self.writeBoolean(true);
    // eslint-disable-next-line no-constant-condition
    if (true) {
      self.writeVInt(0);
      for (let x = 0; x < 0; x++) {
        // pass
      }
    }
  }
}

module.exports = { LogicDailyData };