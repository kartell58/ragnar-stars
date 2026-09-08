/**
 * JOINABLE ALLIANCE LIST  (24304) — the club-discovery tab's default feed,
 * same row layout as the search results (badge, member count, trophies,
 * region, family-friendly).
 */

const { ServerMessage } = require('./serverMessage');
const { Regions } = require('../../../files/csv-logic/regions');

class JoinableAllianceListMessage extends ServerMessage {
  constructor(client, player, clubs) {
    super(client, player);
    this.id = 24304;
    this.clubs = clubs;
  }

  encode() {
    this.writeVInt(this.clubs.length);

    for (const club of this.clubs) {
      this.writeLong(club['ID']);
      this.writeString(club['Name']);
      this.writeDataReference(8, club['BadgeID']);
      this.writeVInt(club['Type']);
      this.writeVInt(club['Members'].length);
      this.writeVInt(club['Trophies']);
      this.writeVInt(club['RequiredTrophies']);
      this.writeDataReference(0, 0);
      this.writeString(new Regions().get_region_string(club['Region']));
      this.writeVInt(0);
      this.writeVInt(club['FamilyFriendly']);
    }
  }
}

module.exports = { JoinableAllianceListMessage };