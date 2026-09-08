/**
 * SET TEAM LOCATION  (14363) — picks the map slot for the party (first vint is
 * the slot index, second the chosen map id); re-sends TeamMessage so every
 * member's screen updates to the selected battle.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamMessage } = require('../server/teamMessage');

class TeamSetLocationMessage extends ClientMessage {
  decode() {
    this.readVInt();
    this.player.map_id = this.readVInt();
  }

  process() {
    new TeamMessage(this.client, this.player).send();
  }
}

module.exports = { TeamSetLocationMessage };