/**
 * GET LEADERBOARD  (14403) — leaderboard tab. type 1 = global trophies,
 * type 0 = per-brawler (brawler data ref), type 2 = club trophies. Sorts the
 * matching table and emits LeaderboardMessage with the top rows.
 */

const { ClientMessage } = require('./clientMessage');
const { LeaderboardMessage } = require('../server/leaderboardMessage');

class GetLeaderboardMessage extends ClientMessage {
  constructor(client, player, initialBytes) {
    super(client, player, initialBytes);
    this.isRegional = false;
    this.brawler = [];
    this.type = 0;
  }

  decode() {
    this.isRegional = this.readBool();
    this.brawler = this.readDataReference();
    this.type = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    if (this.type === 1) {
      this.player.leaderboardData = db.load_all_players_sorted({}, 'Trophies');
      ctx.reply(LeaderboardMessage, this.type, this.brawler, this.isRegional);
    } else if (this.type === 0) {
      this.player.leaderboardData = db.load_all_players_sorted({}, 'BrawlersTrophies', String(this.brawler[1]));
      ctx.reply(LeaderboardMessage, this.type, this.brawler, this.isRegional);
    } else if (this.type === 2) {
      this.player.leaderboardData = db.load_all_clubs_sorted({}, 'Trophies');
      ctx.reply(LeaderboardMessage, this.type, this.brawler, this.isRegional);
    }
  }
}

module.exports = { GetLeaderboardMessage };