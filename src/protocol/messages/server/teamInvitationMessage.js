/**
 * TEAM INVITATION  (24589) — the invite card pushed to the invitee's socket:
 * writer's id/name/trophies/icon/name-color, opened directly with the invitee
 * socket (player=null — this message belongs to the receipient).
 */

const { ServerMessage } = require('./serverMessage');

class TeamInvitationMessage extends ServerMessage {
  constructor(client, invitee_id, inviter_data) {
    super(client, null);
    this.id = 24589;
    this.invitee_id = invitee_id;
    this.inviter_data = inviter_data;
  }

  encode() {
    this.writeVInt(1);

    this.writeInt(0);
    this.writeInt(this.invitee_id);
    this.writeInt(0);
    this.writeInt(this.inviter_data['ID']);

    for (let i = 0; i < 6; i++) this.writeString();

    this.writeInt(this.inviter_data['Trophies']);
    for (let i = 0; i < 4; i++) this.writeInt(0);

    this.writeBoolean(true);
    this.writeInt(0);
    this.writeInt(3);
    this.writeInt(0);
    this.writeString();
    this.writeInt(0);
    this.writeInt(0);

    this.writeString();
    this.writeInt(0);
    this.writeBoolean(true);
    this.writeString(String(this.inviter_data['Name']));
    this.writeVInt(100);
    this.writeVInt(28000000 + parseInt(this.inviter_data['ProfileIcon'], 10));
    this.writeVInt(43000000 + parseInt(this.inviter_data['NameColor'], 10));
  }
}

module.exports = { TeamInvitationMessage };