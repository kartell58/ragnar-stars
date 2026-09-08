/**
 * Game app assembler: builds the RoomRegistry, PacketRouter and the TCP Server
 * for the phone-facing port, wiring the shared 'ctx' (db/logger/security)
 * produced by createBaseContext. Options in ctx override construction so tests
 * can inject fresh singletons.
 */

const { Server } = require('../core/networking/server');
const { PacketRouter } = require('../tcp/router');
const { RoomRegistry } = require('../tcp/rooms');

function createGameApp(ctx) {
  const rooms = ctx.rooms || new RoomRegistry();
  const router =
    ctx.router ||
    new PacketRouter({
      db: ctx.db,
      rooms,
      logger: ctx.logger,
      security: ctx.security,
    });

  const server =
    ctx.server ||
    new Server(ctx.config, {
      db: ctx.db,
      rooms,
      logger: ctx.logger,
      security: ctx.security,
      errorHandler: ctx.errorHandler,
      router,
    });

  return { name: 'game', config: ctx.config, db: ctx.db, rooms, router, server };
}

module.exports = { createGameApp };