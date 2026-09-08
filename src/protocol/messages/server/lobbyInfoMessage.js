/**
 * LOBBY INFO  (23457) — sent on EVERY inbound packet (the router sends it
 * before dispatch): the current connected-clients count plus the server banner
 * ("RagnarStars / version / discord") which the home screen's bottom ticker
 * displays.
 */

const { ServerMessage } = require('./serverMessage');

class LobbyInfoMessage extends ServerMessage {
  constructor(client, player, count) {
    super(client, player);
    this.id = 23457;
    this.count = count;
  }

  encode() {
    this.writeVInt(this.count);
    const version = this.player.client_version || 'unknown';
    this.writeString(
      `RagnarStars\nVersion: ${version}\nDiscord: .gg/yaasxhi`,
    );

    this.writeVInt(0);
    this.writeVInt(0);
  }
}

module.exports = { LobbyInfoMessage };