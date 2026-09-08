/**
 * Packet-id dispatcher. A decoded frame from the client goes through dispatch()
 * in a fixed order:
 *
 *   1. security      banned IP / rate limit -> LoginFailed (socket stays);
 *   2. inbound log   only when a logger is wired in (CLIENT lines);
 *   3. LobbyInfo     ALWAYS sent first — the client replay loop expects lobby
 *                    data (connected-clients count) on every round-trip;
 *   4. factory       unknown id is logged as UNHANDLED and skipped, no crash;
 *   5. handler        new packets[id](client, player, payload).decode() then
 *                    .process(messageCtx), where messageCtx is a per-request
 *                    toolbox (src/tcp/context.js) carrying client/player/ip/
 *                    packetId plus the repo handle and the RoomRegistry, so
 *                    handlers can persist and join/leave teams without the repo
 *                    ever knowing about rooms.
 *
 * 10101 (LoginMessage) additionally registers the player in
 * Helpers.connected_clients — from that point on the client counts as online.
 */

const { packets } = require('../protocol/logicLaserMessageFactory');
const { LobbyInfoMessage } = require('../protocol/messages/server/lobbyInfoMessage');
const { LoginFailedMessage } = require('../protocol/messages/server/loginFailedMessage');
const { Helpers } = require('../utils/helpers');
const { createMessageContext } = require('./context');

class PacketRouter {
  constructor({ db, rooms, logger, security } = {}) {
    this.db = db;
    this.rooms = rooms;
    this.logger = logger || null;
    this.security = security || null;
  }

  dispatch(ctx, frame) {
    const { client, player, ip } = ctx;

    if (this.security) {
      const verdict = this.security.check(ip);
      if (!verdict.allowed) {
        player.err_code = verdict.code;
        new LoginFailedMessage(client, player, 'Account banned!').send();
        return { handled: false, blocked: true };
      }
    }

    if (this.logger) {
      if (frame.packet_id in packets) {
        this.logger.inbound(ip, frame.packet_id, packets[frame.packet_id].name, frame.packet_length);
      } else {
        this.logger.unhandled(frame.packet_id, frame.packet_length);
      }
    }

    new LobbyInfoMessage(client, player, Helpers.connected_clients['ClientsCount']).send();

    if (!(frame.packet_id in packets)) return { handled: false, unhandled: true };

    const message = new packets[frame.packet_id](client, player, frame.packet_data);
    message.decode();

    const messageCtx = createMessageContext({
      client,
      player,
      ip,
      packetId: frame.packet_id,
      db: this.db,
      rooms: this.rooms,
      logger: this.logger,
    });
    message.process(messageCtx);

    if (frame.packet_id === 10101) {
      // LoginMessage: the player is now "connected" for friend/team lookups.
      Helpers.connected_clients['Clients'][String(player.ID)] = { SocketInfo: client, Player: player };
    }

    return { handled: true, name: packets[frame.packet_id].name };
  }
}

module.exports = { PacketRouter };