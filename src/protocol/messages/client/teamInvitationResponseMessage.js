/**
 * INVITATION RESPONSE  (14479) — the invited player's answer. On accept (=1)
 * the party screen opens; if the inviter already picked a map (map_id != 0)
 * the invitee inherits it, so both players land on the same battle slot.
 */

const { ClientMessage } = require('./clientMessage');
const { Helpers } = require('../../../utils/helpers');
const { TeamMessage } = require('../server/teamMessage');

class TeamInvitationResponseMessage extends ClientMessage {
  decode() {
    this.response = this.readVInt();
    this.high_id = this.readInt();
    this.low_id = this.readInt();
  }

  process() {
    if (this.response === 1) {
      const inviter = Helpers.connected_clients['Clients'][String(this.low_id)];
      if (inviter && inviter['Player'].map_id !== 0) {
        this.player.map_id = inviter['Player'].map_id;
      }
      new TeamMessage(this.client, this.player).send();
    }
  }
}

module.exports = { TeamInvitationResponseMessage };