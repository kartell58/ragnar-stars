/**
 * CHANGE ALLIANCE SETTINGS  (14316) — leader-only club edit: description,
 * badge, region, type, required trophies and family-friendly flag are written
 * to the club row and echoed through MyAlliance + 10-code AllianceResponse +
 * AllianceData.
 */

const { ClientMessage } = require('./clientMessage');
const { AllianceResponseMessage } = require('../server/allianceResponseMessage');
const { MyAllianceMessage } = require('../server/myAllianceMessage');
const { AllianceDataMessage } = require('../server/allianceDataMessage');

class ChangeAllianceSettingsMessage extends ClientMessage {
  decode() {
    this.club_id = this.player.club_id;
    this.club_desc = this.readString();
    this.club_badge = this.readDataReference()[1];
    this.club_region = this.readDataReference()[1];
    this.club_type = this.readVInt();
    this.club_req_trophies = this.readVInt();
    this.club_family_friendly = this.readVInt();
  }

  process(ctx) {
    const { db, log } = ctx;
    db.update_club(this.club_id, 'Description', this.club_desc);
    db.update_club(this.club_id, 'Type', this.club_type);
    db.update_club(this.club_id, 'BadgeID', this.club_badge);
    db.update_club(this.club_id, 'RequiredTrophies', this.club_req_trophies);
    db.update_club(this.club_id, 'FamilyFriendly', this.club_family_friendly);
    db.update_club(this.club_id, 'Region', this.club_region);

    log(this.club_region);

    const club_data = db.load_club(this.club_id);

    ctx.reply(MyAllianceMessage, club_data);
    ctx.reply(AllianceResponseMessage, 10);
    ctx.reply(AllianceDataMessage, club_data);
  }
}

module.exports = { ChangeAllianceSettingsMessage };