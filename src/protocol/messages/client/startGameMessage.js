/**
 * START GAME  (14103) — the client picked a map slot. The slot index resolves
 * to a LocationID via config/events.json (fallback map 7), the player joins a
 * fresh matchmaking room in the registry, and the server acknowledges with
 * MatchMakingCancelled + TeamMessage to move the phone into the pre-battle
 * screen.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamMessage } = require('../server/teamMessage');
const { MatchMakingCancelledMessage } = require('../server/matchMakingCancelledMessage');
const fs = require('node:fs');
const { rootPath } = require('../../../utils/paths');

class StartGameMessage extends ClientMessage {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readVInt();
    this.map_slot = this.readVInt();
  }

  process(ctx) {
    const { rooms } = ctx;
    try {
      const events = JSON.parse(fs.readFileSync(rootPath('config/events.json'), 'utf-8'));
      this.player.map_id = (events[this.map_slot - 1] && events[this.map_slot - 1]['LocationID']) || 0;
    } catch (e) {
      this.player.map_id = 7;
    }

    if (rooms) {
      rooms.join(this.player.ID, null, { matchmaking: true, mapId: this.player.map_id, mapSlot: this.map_slot });
    }

    ctx.reply(MatchMakingCancelledMessage);
    ctx.reply(TeamMessage);
  }
}

module.exports = { StartGameMessage };