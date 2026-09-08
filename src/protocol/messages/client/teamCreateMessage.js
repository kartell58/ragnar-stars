/**
 * CREATE TEAM  (14350) — the party leader starts a room: the chosen map slot
 * resolves through config/events.json (a slot of -64 means offline practise →
 * the fixed tutorial map 7), the leader joins a registry room, and TeamMessage
 * renders the party screen.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamMessage } = require('../server/teamMessage');
const fs = require('node:fs');
const { rootPath } = require('../../../utils/paths');

class TeamCreateMessage extends ClientMessage {
  decode() {
    this.map_slot = this.readVInt();
    this.map_id = this.readVInt();
    this.room_type = this.readVInt();
  }

  process(ctx) {
    const { rooms } = ctx;
    if (this.map_slot !== -64) {
      const events = JSON.parse(fs.readFileSync(rootPath('config/events.json'), 'utf-8'));
      this.player.map_id = (events[this.map_slot - 1] && events[this.map_slot - 1]['LocationID']) || 0;
    } else {
      this.player.map_id = 7;
    }

    if (rooms) {
      rooms.join(this.player.ID, null, { mapSlot: this.map_slot, mapId: this.player.map_id });
    }

    ctx.reply(TeamMessage);
  }
}

module.exports = { TeamCreateMessage };