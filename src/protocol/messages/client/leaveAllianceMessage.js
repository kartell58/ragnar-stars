/**
 * LEAVE ALLIANCE  (14308) — quit the club: the last member auto-deletes the
 * club, otherwise the member is spliced out and the roster persisted. The
 * player returns to no-club (ClubID 0) and sees an 80-code response + an empty
 * MyAlliance.
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceResponseMessage } = require('../server/allianceResponseMessage');
const { MyAllianceMessage } = require('../server/myAllianceMessage');

class LeaveAllianceMessage extends ClientMessage {
  decode() {}

  process(ctx) {
    const { db } = ctx;
    const club_data = db.load_club(this.player.club_id);

    if (club_data['Members'].length === 1) {
      db.delete_club(this.player.club_id);
    } else {
      for (const member of club_data['Members'].slice()) {
        if (member['ID'] === this.player.ID) {
          club_data['Members'].splice(club_data['Members'].indexOf(member), 1);
          db.update_club(this.player.club_id, 'Members', club_data['Members']);
          break;
        }
      }
    }

    this.player.club_id = 0;
    db.update_player_account(this.player.token, 'ClubID', 0);

    ctx.reply(AllianceResponseMessage, 80);
    ctx.reply(MyAllianceMessage, { ID: 0 });
  }
}

module.exports = { LeaveAllianceMessage };