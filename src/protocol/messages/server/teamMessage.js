/**
 * TEAM  (24124) — the party screen render. Single-player parties: one member
 * slot with the player's id, home brawler/skin, level pins (99999), profile
 * icon, star power + gadget (data-ref 23), the selected map (data-ref 15) and
 * the use-gadget flag. The empty trailing loops are fixed layout fields.
 */

const { ServerMessage } = require('./serverMessage');
const { Helpers } = require('../../../utils/helpers');

class TeamMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 24124;
  }

  encode() {
    this.writeVInt(1);
    this.writeUInt8(0);
    this.writeVInt(1);
    this.writeLong(Helpers.randomMapID());
    this.writeUInt8(0);
    this.writeUInt8(0);
    this.writeVInt(0);
    this.writeVInt(0);

    this.writeDataReference(15, this.player.map_id);

    this.writeVInt(1);
    for (let x = 0; x < 1; x++) {
      this.writeVInt(1);

      this.writeLong(this.player.ID);

      this.writeDataReference(16, this.player.home_brawler);
      this.writeDataReference(29, this.player.home_skin);

      this.writeVInt(99999);
      this.writeVInt(99999);
      this.writeVInt(10);

      this.writeVInt(3);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(0);

      this.writeString(this.player.name);
      this.writeVInt(100);
      this.writeVInt(28000000 + this.player.profile_icon);
      this.writeVInt(43000000 + this.player.name_color);

      if (this.player.starpower != null) {
        this.writeDataReference(23, this.player.starpower);
      } else {
        this.writeVInt(0);
      }
      if (this.player.gadget != null) {
        this.writeDataReference(23, this.player.gadget);
      } else {
        this.writeVInt(0);
      }
    }

    this.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      // pass
    }

    this.writeVInt(0);
    for (let x = 0; x < 0; x++) {
      // pass
    }

    this.writeUInt8(0);
    if (this.player.use_gadget) {
      this.writeUInt8(6);
    } else {
      this.writeUInt8(0);
    }
  }
}

module.exports = { TeamMessage };