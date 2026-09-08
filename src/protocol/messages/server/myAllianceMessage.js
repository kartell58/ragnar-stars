/**
 * MY ALLIANCE  (24399) — "my club" widget on the home screen: presence flag +
 * the club's summary card (or just the flag when club_id == 0).
 */

const { ServerMessage } = require('./serverMessage');
const { Regions } = require('../../../files/csv-logic/regions');

class MyAllianceMessage extends ServerMessage {
  constructor(client, player, club_data) {
    super(client, player);
    this.id = 24399;
    this.club_data = club_data;
  }

  encode() {
    this.writeVInt(0);
    this.writeBoolean(this.player.club_id !== 0);

    if (this.player.club_id !== 0) {
      this.writeDataReference(25, this.player.club_role);

      this.writeLong(this.club_data['ID']);
      this.writeString(this.club_data['Name']);
      this.writeDataReference(8, this.club_data['BadgeID']);
      this.writeVInt(this.club_data['Type']);
      this.writeVInt(this.club_data['Members'].length);
      this.writeVInt(this.club_data['Trophies']);
      this.writeVInt(this.club_data['RequiredTrophies']);
      this.writeDataReference(0, 0);
      this.writeString(new Regions().get_region_string(this.club_data['Region']));
      this.writeVInt(0);
      this.writeVInt(this.club_data['FamilyFriendly']);
    }
  }
}

module.exports = { MyAllianceMessage };