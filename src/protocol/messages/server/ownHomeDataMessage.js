/**
 * OWN HOME DATA  (24101) — the main-menu snapshot: the client's home blob
 * (LogicClientHome: resources, shop, boxes, events…) + avatar blob
 * (LogicClientAvatar: brawler grid, selected skins…) + a server timestamp.
 * Sent on login, on every "go home", and to refresh the lobby.
 */

const { ServerMessage } = require('./serverMessage');
const { LogicClientHome } = require('../../../logic/clientHome');
const { LogicClientAvatar } = require('../../../logic/clientAvatar');

class OwnHomeDataMessage extends ServerMessage {
  constructor(client, player) {
    super(client, player);
    this.id = 24101;
    this.time_stamp = Math.floor(Date.now() / 1000);
  }

  encode() {
    LogicClientHome.encode(this);
    LogicClientAvatar.encode(this);

    this.writeVInt(this.time_stamp);
  }
}

module.exports = { OwnHomeDataMessage };