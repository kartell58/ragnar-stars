/**
 * TOGGLE TEAM SETTINGS  (14372) — flips the party "use gadget" toggle and
 * refreshes the team screen.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamMessage } = require('../server/teamMessage');

class TeamToggleSettingsMessage extends ClientMessage {
  decode() {
    this.player.use_gadget = this.readBool();
  }

  process() {
    new TeamMessage(this.client, this.player).send();
  }
}

module.exports = { TeamToggleSettingsMessage };