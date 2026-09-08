const { Cards } = require('../files/csv-logic/cards');

class LogicClientAvatar {
  static encode(writer) {
    writer.writeVInt(0);
    writer.writeVInt(0);

    for (let x = 0; x < 3; x++) writer.writeLogicLong(writer.player.ID);

    writer.writeString(writer.player.name);
    writer.writeBoolean(writer.player.name_set);

    writer.writeInt(0);

    writer.writeVInt(8); // Commodity Array

    const cards = new Cards();
    writer.player.brawlers_card_id = [];
    for (const x of writer.player.brawlers_unlocked) {
      writer.player.brawlers_card_id.push(cards.get_unlock_by_brawler_id(x));
    }

    // Unlocked Brawlers & Resources array
    writer.writeVInt(writer.player.resources.length + writer.player.brawlers_card_id.length);

    for (const x of writer.player.brawlers_card_id) {
      writer.writeDataReference(23, x);
      writer.writeVInt(1);
    }

    for (const resource of writer.player.resources) {
      writer.writeDataReference(5, resource['ID']);
      writer.writeVInt(resource['Amount']);
    }

    writer.writeVInt(writer.player.brawlers_id.length);
    for (const x of writer.player.brawlers_id) {
      writer.writeDataReference(16, x);
      writer.writeVInt(writer.player.brawlers_trophies[String(x)]);
    }

    writer.writeVInt(writer.player.brawlers_id.length);
    for (const x of writer.player.brawlers_id) {
      writer.writeDataReference(16, x);
      writer.writeVInt(writer.player.brawlers_high_trophies[String(x)]);
    }

    writer.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      writer.writeDataReference(16, x);
      writer.writeVInt(0);
    }

    writer.writeVInt(writer.player.brawlers_unlocked.length);
    for (const x of writer.player.brawlers_unlocked) {
      writer.writeDataReference(16, x);
      writer.writeVInt(writer.player.brawlers_powerpoints[String(x)]);
    }

    writer.writeVInt(writer.player.brawlers_id.length);
    for (const x of writer.player.brawlers_id) {
      writer.writeDataReference(16, x);
      writer.writeVInt(writer.player.brawlers_level[String(x)]);
    }

    writer.writeVInt(writer.player.brawlers_spg.length);
    for (const x of writer.player.brawlers_spg) {
      writer.writeDataReference(23, x);
      writer.writeVInt(1);
    }

    writer.writeVInt(0); // New Brawlers Array
    for (let x = 0; x < 0; x++) {
      writer.writeDataReference(16, x);
      writer.writeVInt(0);
    }

    writer.writeVInt(writer.player.gems); // Player Gems
    writer.writeVInt(writer.player.gems); // Player Free Gems

    for (let i = 0; i < 9; i++) writer.writeVInt(0);

    writer.writeVInt(2); // Tutorial State
  }
}

module.exports = { LogicClientAvatar };