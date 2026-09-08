/**
 * Per-connection crash bucket. A bad packet must never take the server down:
 * handle() logs the stack with IP/packet context and lets the client thread
 * disconnect that socket only.
 */

const { error } = require('../utils/logger');

function createErrorHandler() {
  return {
    handle(err, ctx = {}) {
      const where = [ctx.ip && `IP: ${ctx.ip}`, ctx.packetId != null && `PacketID: ${ctx.packetId}`]
        .filter(Boolean)
        .join(', ');
      error(`[ERROR] ${where ? `${where} ` : ''}crashed connection: ${err.message}\n${err.stack}`);
    },
  };
}

module.exports = { createErrorHandler };