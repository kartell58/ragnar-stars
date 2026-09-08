/**
 * ALLIANCE DATA  (24301) — the FULL club card (id 0 → empty 2): summary block
 * plus every member's row (role, trophies, name, icon/name-color ids). Used
 * when viewing/editing the club.
 */

const { ServerMessage } = require('./serverMessage');
const { Regions } = require('../../../files/csv-logic/regions');

class AllianceDataMessage extends ServerMessage {
  constructor(client, player, club_data) {
    super(client, player);
    this.id = 24301;
    this.club_data = club_data;
  }

  encode() {
    if (this.club_data['ID'] !== 0) {
      this.writeVInt(0);
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

      this.writeString(this.club_data['Description']);

      this.writeVInt(this.club_data['Members'].length);

      for (const member of this.club_data['Members']) {
        this.writeLong(member['ID']);
        this.writeVInt(member['Role']);
        this.writeVInt(member['Trophies']);
        this.writeVInt(2);
        this.writeVInt(0);
        this.writeVInt(0);

        this.writeString(member['Name']);
        this.writeVInt(100);
        this.writeVInt(28000000 + member['ProfileIcon']);
        this.writeVInt(43000000 + member['NameColor']);
      }
    } else {
      this.writeVInt(2);
    }
  }
}

module.exports = { AllianceDataMessage };