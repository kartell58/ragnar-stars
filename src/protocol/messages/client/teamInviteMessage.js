/**
 * INVITE TO TEAM  (14365) — pushes a TeamInvitationMessage to the invited
 * player's socket when they are online (looked up by low id in
 * Helpers.connected_clients); the invite card shows the inviter's
 * name/trophies/icon/name-color. Offline target → silently dropped.
 */

const { ClientMessage } = require('./clientMessage');
const { Helpers } = require('../../../utils/helpers');
const { TeamInvitationMessage } = require('../server/teamInvitationMessage');

class TeamInviteMessage extends ClientMessage {
  decode() {
    this.high_id = this.readVInt();
    this.low_id = this.readVInt();
  }

  process() {
    const entry = Helpers.connected_clients['Clients'][String(this.low_id)];
    if (!entry) return;

    const inviter_data = {
      ID: this.player.ID,
      Name: this.player.name,
      Trophies: this.player.trophies,
      ProfileIcon: this.player.profile_icon,
      NameColor: this.player.name_color,
    };

    try {
      new TeamInvitationMessage(entry['SocketInfo'], this.low_id, inviter_data).send();
    } catch (e) {
      // pass
    }
  }
}

module.exports = { TeamInviteMessage };