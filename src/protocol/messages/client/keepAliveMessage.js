/**
 * KEEP ALIVE  (10108) — the client's heartbeat. No payload to decode; the
 * reply is KeepAliveOk plus a fresh LobbyInfo so the home screen's "online"
 * count stays live while the phone idles.
 */

const { ClientMessage } = require('./clientMessage');
const { KeepAliveOkMessage } = require('../server/keepAliveOkMessage');
const { LobbyInfoMessage } = require('../server/lobbyInfoMessage');
const { Helpers } = require('../../../utils/helpers');

class KeepAliveMessage extends ClientMessage {
  decode() {}

  process(ctx) {
    ctx.reply(KeepAliveOkMessage);
    ctx.reply(LobbyInfoMessage, Helpers.connected_clients['ClientsCount']);
  }
}

module.exports = { KeepAliveMessage };