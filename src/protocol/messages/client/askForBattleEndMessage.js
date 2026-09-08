/**
 * ASK FOR BATTLE END  (14110) — match results coming back from a finished
 * battle (count 3/6/10, only while status 8 = in-match). Trophies: showdown
 * ranks use the [12,11,…,−10] table, normal modes the TROPHY_TABLE win/loss
 * ladder keyed on the brawler's current trophies; totals and per-brawler
 * trophies are updated and persisted, then BattleEndMessage reports the
 * gamemode inferred from teams/rank plus the change.
 */

const { ClientMessage } = require('./clientMessage');
const { BattleEndMessage } = require('../server/battleEndMessage');

const TROPHY_TABLE = [
  [100, 8, 5], [200, 8, 6], [300, 7, 7], [400, 7, 8], [500, 6, 8],
  [600, 6, 9], [700, 5, 9], [800, 5, 10], [900, 4, 10], [1000, 4, 11],
  [1100, 3, 11], [1200, 3, 12], [1300, 2, 12], [1400, 2, 13],
];

function get_trophy_change(brawler_trophies, is_victory) {
  let win = 1;
  let loss = 1;
  let found = false;
  for (const [limit, w, l] of TROPHY_TABLE) {
    if (brawler_trophies < limit) {
      win = w;
      loss = l;
      found = true;
      break;
    }
  }
  if (!found) {
    win = 1;
    loss = 13;
  }
  return is_victory ? win : -loss;
}

class AskForBattleEndMessage extends ClientMessage {
  constructor(client, player, initialBytes) {
    super(client, player, initialBytes);
    this.players = [];
  }

  decode() {
    this.result = this.readVInt();
    this.unk = this.readVInt();
    this.rank = this.readVInt();
    this.mapID = this.readDataReference();

    this.count = this.readVInt();

    for (let player = 0; player < this.count; player++) {
      this.players.push({
        id: this.readDataReference(),
        skin: this.readDataReference(),
        team: this.readVInt(),
        isPlayer: this.readVInt(),
        name: this.readString(),
      });
    }
  }

  process(ctx) {
    const { db, log } = ctx;
    if (this.player.status !== 8) return;
    if (![3, 6, 10].includes(this.count)) return;

    log(`[DEBUG] BattleEnd: status=${this.player.status} count=${this.count} result=${this.result} rank=${this.rank}`);

    if (this.rank !== 0) {
      if (this.players[0]['team'] === this.players[1]['team']) {
        this.player.gamemode = 5;
      } else {
        this.player.gamemode = 2;
      }
    } else {
      this.player.gamemode = 0;
    }

    let trophies_change = 0;
    try {
      trophies_change = this.update_trophies(db);
    } catch (e) {
      log(`[DEBUG] Trophy update failed: ${e}`);
    }

    ctx.reply(BattleEndMessage, this.player.gamemode, this.result, this.players, trophies_change);
  }

  update_trophies(db) {
    let brawler_key = null;
    for (const hero of this.players) {
      if (hero['isPlayer'] === 1 && hero['id']) {
        brawler_key = String(hero['id'][1]);
        break;
      }
    }

    if (brawler_key === null) return 0;

    const brawler_trophies = parseInt(this.player.brawlers_trophies[brawler_key] || 0, 10);

    let trophies_change = 0;
    if (this.rank !== 0) {
      const showdown = [12, 11, 10, 9, 8, 7, -2, -4, -8, -10];
      trophies_change = this.rank >= 1 && this.rank <= showdown.length ? showdown[this.rank - 1] : 0;
    } else {
      const result = parseInt(this.result || 0, 10);
      if (result === 0) {
        trophies_change = get_trophy_change(brawler_trophies, true);
      } else if (result === 1) {
        trophies_change = get_trophy_change(brawler_trophies, false);
      } else {
        return 0;
      }
    }

    if (trophies_change <= 0 && brawler_trophies <= 0) return 0;

    const new_trophies = Math.max(0, brawler_trophies + trophies_change);
    const actual_change = new_trophies - brawler_trophies;

    this.player.brawlers_trophies[brawler_key] = new_trophies;

    this.player.trophies = Math.max(0, parseInt(this.player.trophies || 0, 10) + actual_change);
    if (this.player.trophies > parseInt(this.player.high_trophies || 0, 10)) {
      this.player.high_trophies = this.player.trophies;
    }

    db.update_player_account(this.player.token, 'Trophies', this.player.trophies);
    db.update_player_account(this.player.token, 'HighestTrophies', this.player.high_trophies);
    db.update_player_account(this.player.token, 'BrawlersTrophies', this.player.brawlers_trophies);

    return actual_change;
  }
}

module.exports = { AskForBattleEndMessage, get_trophy_change };