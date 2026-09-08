/**
 * CREATE ALLIANCE  (14301) — found a club: creates the club row with the
 * founder (Role 2) as sole member, assigns the player's ClubID/Role, then
 * sends MyAlliance + a 20-code AllianceResponse + the full AllianceData.
 */

const { ClientMessage } = require('./clientMessage');
const { Helpers } = require('../../../utils/helpers');
const { MyAllianceMessage } = require('../server/myAllianceMessage');
const { AllianceResponseMessage } = require('../server/allianceResponseMessage');
const { AllianceDataMessage } = require('../server/allianceDataMessage');

class CreateAllianceMessage extends ClientMessage {
  decode() {
    this.club_name = this.readString();
    this.club_desc = this.readString();
    this.club_badge = this.readDataReference()[1];
    this.club_region = this.readDataReference()[1];
    this.club_type = this.readVInt();
    this.club_req_trophies = this.readVInt();
    this.club_family_friendly = this.readVInt();
  }

  process(ctx) {
    const { db } = ctx;
    const data = {
      Name: this.club_name,
      Description: this.club_desc,
      Region: this.club_region,
      BadgeID: this.club_badge,
      Type: this.club_type,
      Trophies: this.player.trophies,
      RequiredTrophies: this.club_req_trophies,
      FamilyFriendly: this.club_family_friendly,
      Members: [
        {
          Name: this.player.name,
          ID: this.player.ID,
          Role: 2,
          Trophies: this.player.trophies,
          ProfileIcon: this.player.profile_icon,
          NameColor: this.player.name_color,
        },
      ],
      Messages: [],
    };

    this.player.club_id = Helpers.randomID();
    this.player.club_role = 2;

    db.create_club(this.player.club_id, data);
    db.update_player_account(this.player.token, 'ClubID', this.player.club_id);
    db.update_player_account(this.player.token, 'ClubRole', this.player.club_role);

    const club_data = db.load_club(this.player.club_id);

    ctx.reply(MyAllianceMessage, club_data);
    ctx.reply(AllianceResponseMessage, 20);
    ctx.reply(AllianceDataMessage, club_data);
  }
}

module.exports = { CreateAllianceMessage };