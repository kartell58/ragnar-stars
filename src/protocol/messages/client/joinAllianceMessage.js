/**
 * JOIN ALLIANCE  (14305) — join by club id (open clubs only, no trophy gate
 * server-side): appends the player to the roster (Role 1), bumps club
 * trophies, persists both sides, and answers with the 40-code AllianceResponse
 * + MyAlliance + the fresh message stream.
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceResponseMessage } = require('../server/allianceResponseMessage');
const { MyAllianceMessage } = require('../server/myAllianceMessage');
const { AllianceStreamMessage } = require('../server/allianceStreamMessage');

class JoinAllianceMessage extends ClientMessage {
  decode() {
    this.club_id = this.readLong();
  }

  process(ctx) {
    const { db } = ctx;
    this.player.club_id = this.club_id;
    this.player.club_role = 1;

    const club_data = db.load_club(this.club_id);
    club_data['Members'].push({
      Name: this.player.name,
      ID: this.player.ID,
      Role: this.player.club_role,
      Trophies: this.player.trophies,
      ProfileIcon: this.player.profile_icon,
      NameColor: this.player.name_color,
    });

    db.update_club(this.club_id, 'Members', club_data['Members']);
    db.update_club(this.club_id, 'Trophies', club_data['Trophies'] + this.player.trophies);
    db.update_player_account(this.player.token, 'ClubID', this.player.club_id);
    db.update_player_account(this.player.token, 'ClubRole', this.player.club_role);

    ctx.reply(AllianceResponseMessage, 40);
    ctx.reply(MyAllianceMessage, club_data);
    ctx.reply(AllianceStreamMessage, club_data['Messages']);
  }
}

module.exports = { JoinAllianceMessage };