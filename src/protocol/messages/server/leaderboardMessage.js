/**
 * LEADERBOARD  (24403) — ranked top-N table: type 1 global / 0 per-brawler /
 * 2 clubs; regional boards carry the player's region string. Each row is a
 * player entry (trophies, name + icon ids) or a club entry (name, member
 * count, badge) depending on the type.
 */

const { ServerMessage } = require('./serverMessage');
const { log } = require('../../../utils/logger');

class LeaderboardMessage extends ServerMessage {
  constructor(client, player, type, brawler, regional) {
    super(client, player);
    this.id = 24403;
    this.leaderboardType = type;
    this.brawler = brawler;
    this.isRegional = regional;
  }

  encode() {
    log(this.leaderboardType);
    this.writeVInt(this.leaderboardType);
    this.writeVInt(0);
    this.writeDataReference(this.brawler[0], this.brawler[1]);
    this.writeString(this.isRegional ? this.player.region : null);

    this.writeVInt(this.player.leaderboardData.length);
    for (const entry of this.player.leaderboardData) {
      this.writeLogicLong(entry['ID']);
      this.writeVInt(1);
      this.writeVInt(entry['Trophies']);

      this.writeBooleanTest(this.leaderboardType === 0 || this.leaderboardType === 1);
      if (this.leaderboardType === 0 || this.leaderboardType === 1) {
        this.writeString();
        this.writeString(entry['Name']);

        this.writeVInt(9);
        this.writeVInt(28000000 + entry['ProfileIcon']);
        this.writeVInt(43000000 + entry['NameColor']);
        this.writeVInt(0);
      }

      this.writeBooleanTest(this.leaderboardType === 2);
      if (this.leaderboardType === 2) {
        this.writeString(entry['Name']);
        this.writeVInt(entry['Members'].length);
        this.writeDataReference(8, entry['BadgeID']);
      }
    }

    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeString(this.player.region);
  }
}

module.exports = { LeaderboardMessage };