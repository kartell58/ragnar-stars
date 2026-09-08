/**
 * PLAYER PROFILE  (24113) — the "card" view of any account: brawler grid with
 * trophies/levels (+2 level offset), the ProfileStats summary
 * (logicPlayerStats), name/icon/name-color and — when the target is in a club —
 * the club block (badge, region via regions.csv, member count…).
 */

const { ServerMessage } = require('./serverMessage');
const { Regions } = require('../../../files/csv-logic/regions');
const { getPlayerStats } = require('../../../logic/avatar/logicPlayerStats');

class PlayerProfileMessage extends ServerMessage {
  constructor(client, player, player_data, db) {
    super(client, player);
    this.id = 24113;
    this.player_data = player_data;
    this.db = db;
  }

  encode() {
    this.writeLogicLong(this.player_data['ID']);

    this.writeDataReference(0, 0);

    this.writeVInt(this.player_data['UnlockedBrawlers'].length);
    for (const x of this.player_data['UnlockedBrawlers']) {
      this.writeDataReference(16, x);
      this.writeDataReference(0, 0);
      this.writeVInt(this.player_data['BrawlersTrophies'][String(x)]);
      this.writeVInt(this.player_data['BrawlersHighestTrophies'][String(x)]);
      this.writeVInt(this.player_data['BrawlersLevel'][String(x)] + 2);
    }

    this.playerStats = getPlayerStats(this.player_data);

    const keys = Object.keys(this.playerStats);
    this.writeVInt(keys.length);
    for (const x of keys) {
      this.writeVInt(keys.indexOf(x) + 1);
      this.writeVInt(this.playerStats[x]);
    }

    this.writeString(this.player_data['Name']);
    this.writeVInt(100);
    this.writeVInt(28000000 + this.player_data['ProfileIcon']);
    this.writeVInt(43000000 + this.player_data['NameColor']);

    if (this.player_data['ClubID'] !== 0) {
      const club_data = this.db.load_club(this.player_data['ClubID']);

      this.writeBoolean(true);
      this.writeLogicLong(club_data['ID']);
      this.writeString(club_data['Name']);
      this.writeDataReference(8, club_data['BadgeID']);
      this.writeVInt(club_data['Type']);
      this.writeVInt(club_data['Members'].length);
      this.writeVInt(club_data['Trophies']);
      this.writeVInt(club_data['RequiredTrophies']);
      this.writeDataReference(0, 0);
      this.writeString(new Regions().get_region_string(club_data['Region']));
      this.writeVInt(0);
      this.writeUInt8(0);
      this.writeDataReference(25, this.player_data['ClubRole']);
    } else {
      this.writeBoolean(false);
      this.writeVInt(0);
    }
  }
}

module.exports = { PlayerProfileMessage };