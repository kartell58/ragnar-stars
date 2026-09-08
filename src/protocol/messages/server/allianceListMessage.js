/**
 * ALLIANCE LIST  (24310) — search results for clubs: echoes the query and
 * streams each match (badge, type, member count, trophies, region via
 * regions.csv, family-friendly flag).
 */

const { ServerMessage } = require('./serverMessage');
const { Regions } = require('../../../files/csv-logic/regions');

class AllianceListMessage extends ServerMessage {
  constructor(client, player, query, clubs) {
    super(client, player);
    this.id = 24310;
    this.query = query;
    this.clubs = clubs;
  }

  encode() {
    this.writeString(this.query);

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

module.exports = { AllianceListMessage };