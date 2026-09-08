/**
 * ALLIANCE STREAM  (24311) — club chat/activity feed. Event 4 messages are
 * generic activity lines (short vint payload), anything else carries a text
 * message; natively skips (writes 0) when the player has no club.
 */

const { ServerMessage } = require('./serverMessage');
const { log } = require('../../../utils/logger');

class AllianceStreamMessage extends ServerMessage {
  constructor(client, player, msg) {
    super(client, player);
    this.id = 24311;
    this.msg = msg;
  }

  encode() {
    if (this.player.club_id !== 0) {
      this.writeVInt(this.msg.length);
      for (const x of this.msg) {
        log(x);
        this.writeVInt(x['Event']);
        this.writeVInt(0);
        this.writeVInt(x['Tick']);
        this.writeLogicLong(x['PlayerID']);
        this.writeString(x['PlayerName']);
        this.writeVInt(x['PlayerRole']);
        this.writeVInt(0);
        this.writeVInt(0);

        if (x['Event'] === 4) {
          this.writeVInt(x['Message']);
          this.writeVInt(1);
          this.writeVInt(0);
          this.writeLogicLong(x['PlayerID']);
          this.writeString(x['PlayerName']);
        } else {
          this.writeString(x['Message']);
        }
      }
    } else {
      this.writeVInt(0);
    }
  }
}

module.exports = { AllianceStreamMessage };