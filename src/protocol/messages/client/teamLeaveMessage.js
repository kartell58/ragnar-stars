/**
 * LEAVE TEAM  (14353) — leaves the current registry room (last member out
 * deletes it) and answers with TeamLeftMessage so the client closes the party
 * screen.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamLeftMessage } = require('../server/teamLeftMessage');

class TeamLeaveMessage extends ClientMessage {
  decode() {}

  process(ctx) {
    const { rooms } = ctx;
    if (rooms) rooms.leave(this.player.ID);

    ctx.reply(TeamLeftMessage);
  }
}

module.exports = { TeamLeaveMessage };