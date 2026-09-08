/**
 * Per-request "toolbox" context, mirroring the FreeFire server's ctx object:
 * the router resolves EVERYTHING a handler needs once and hands it over as a
 * single argument — client, player, repo handle, rooms, logger. Handlers no
 * longer re-derive shared state or stash it on the player (the old player.db
 * backdoor is gone).
 *
 * ctx.log  -> pino facade (utils/logger), always available.
 * ctx.reply-> build + send a server message against THIS request's client and
 *            player. Handlers that must push to another account (friend/team
 *            notify) still construct the message explicitly.
 */

const { log } = require('../utils/logger');

function createMessageContext({ client, player, ip, packetId, db, rooms, logger } = {}) {
  return {
    client,
    player,
    ip,
    packetId,
    db,
    rooms,
    logger,
    log: (...args) => log(...args),
    reply(MessageClass, ...args) {
      return new MessageClass(client, player, ...args).send();
    },
  };
}

module.exports = { createMessageContext };