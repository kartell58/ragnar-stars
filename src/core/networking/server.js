/**
 * Game TCP listener. Accepts phones, gives each connection a ClientThread
 * (which feeds decoded frames to the router) and wires the shared middleware —
 * logger, security (ban/rate-limit), errorHandler — plus the repo and the room
 * registry so every path sees the same singletons. socket.setNoDelay + a
 * convenience `send()` keep replies timely; binds to config.net.host:port.
 */

const net = require('node:net');
const { Helpers } = require('../../utils/helpers');
const { getRepo } = require('../../db/repo');
const { RoomRegistry } = require('../../tcp/rooms');
const { PacketRouter } = require('../../tcp/router');
const { ClientThread } = require('./clientThread');
const { createRequestLogger } = require('../../middleware/requestLogger');
const { createSecurity } = require('../../middleware/security');
const { createErrorHandler } = require('../../middleware/errorHandler');
const { log } = require('../../utils/logger');

class Server {
  constructor(config, options = {}) {
    this.config = config;
    this.db = options.db || getRepo();
    this.rooms = options.rooms || new RoomRegistry();
    this.logger = options.logger || createRequestLogger();
    this.security = options.security || createSecurity(config);
    this.errorHandler = options.errorHandler || createErrorHandler();
    this.router = options.router || new PacketRouter({ db: this.db, rooms: this.rooms, logger: this.logger, security: this.security });

    this.ip = options.host || config.net.host;
    this.port = options.port || config.net.port;

    this.server = net.createServer((socket) => {
      socket.send = (data) => socket.write(data);
      socket.setNoDelay(true);
      this.logger.connection(socket.remoteAddress, 'connected');

      const thread = new ClientThread(socket, socket.remoteAddress, {
        config,
        router: this.router,
        logger: this.logger,
        errorHandler: this.errorHandler,
      });
      thread.run();

      Helpers.connected_clients['ClientsCount'] += 1;
    });

    this.server.on('error', (e) => {
      log(`\x1b[91m[ERROR] Server error occurred! ${e.code || e.message}\x1b[39m`);
    });
  }

  start() {
    this.server.listen(this.port, this.ip);
    log(`\x1b[36m[DEBUG] Server started! Listening on ${this.ip}:${this.port}\x1b[39m`);
  }

  close() {
    if (this.server && this.server.listening) this.server.close();
  }
}

module.exports = { Server };