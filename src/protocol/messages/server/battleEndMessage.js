/**
 * BATTLE END  (23456) — the results screen summary: gamemode, result/rank,
 * trophy change (clamped ≥0) and per-HELPER team inference (team 0..3 derived
 * from isPlayer/team-of-first), each plus the score/profile block. The
 * trailing fixed vint fields match the original layout.
 */

const { ServerMessage } = require('./serverMessage');

class BattleEndMessage extends ServerMessage {
  constructor(client, player, gamemode, result, players, trophiesGained = 0) {
    super(client, player);
    this.id = 23456;
    this.gamemode = gamemode;
    this.result = result;
    this.players = players;
    this.trophiesGained = trophiesGained;
  }

  encode() {
    this.writeVInt(this.gamemode);
    this.writeVInt(this.result);
    this.writeVInt(0);
    this.writeVInt(Math.max(0, this.trophiesGained));
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(0);
    this.writeVInt(32);
    this.writeVInt(0);
    this.writeVInt(0);

    this.writeVInt(this.players.length);
    for (const hero of this.players) {
      let team = 0;
      if (hero['isPlayer'] === 1 && hero['team'] === 1) team += 1;
      if (hero['team'] !== this.players[0]['team']) team += 2;
      this.writeVInt(team);
      this.writeDataReference(hero['id'][0], hero['id'][1]);
      this.writeDataReference(hero['skin'][0], hero['skin'][1]);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(1);
      this.writeBoolean(hero['isPlayer'] === 1);
      if (hero['isPlayer'] === 1) {
        this.writeLong(this.player.ID);
      }
      this.writeString(hero['name']);
      this.writeVInt(0);
      this.writeVInt(28000000);
      this.writeVInt(43000000);
    }

    this.writeVInt(2);
    for (let x = 0; x < 1; x++) {
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(8);
      this.writeVInt(0);
    }

    this.writeVInt(0);

    this.writeVInt(2);
    for (let x = 0; x < 1; x++) {
      this.writeVInt(1);
      this.writeVInt(0);
      this.writeVInt(0);
      this.writeVInt(5);
      this.writeVInt(0);
      this.writeVInt(0);
    }

    this.writeDataReference(28, 0);
    this.writeBoolean(false);
  }
}

module.exports = { BattleEndMessage };