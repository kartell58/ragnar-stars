/**
 * CHAT TO ALLIANCE STREAM  (14315) — club chat: appends a typed message
 * (monotonic tick per member) to the club's Messages, persists the log, then
 * pushes the single message to every roster member's socket via sendByID
 * (online members get it live; a dead socket throws harmlessly).
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceStreamMessage } = require('../server/allianceStreamMessage');

class ChatToAllianceStreamMessage extends ClientMessage {
  decode() {
    this.msg = this.readString();
  }

  process(ctx) {
    const { db } = ctx;
    const club_data = db.load_club(this.player.club_id);

    this.player.message_tick = club_data['Messages'].length
      ? club_data['Messages'][club_data['Messages'].length - 1]['Tick']
      : this.player.message_tick;
    this.player.message_tick += 1;

    const message = {
      Event: 2,
      Message: this.msg,
      PlayerID: this.player.ID,
      PlayerName: this.player.name,
      PlayerRole: this.player.club_role,
      Tick: this.player.message_tick,
    };

    club_data['Messages'].push(message);
    db.update_club(this.player.club_id, 'Messages', club_data['Messages']);

    for (const member of club_data['Members']) {
      const member_id = member['ID'];
      new AllianceStreamMessage(this.client, this.player, [message]).sendByID(member_id);
    }
  }
}

module.exports = { ChatToAllianceStreamMessage };