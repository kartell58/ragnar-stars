/**
 * Request tracer (middleware layer). Wired into the router as `logger`; emits
 * colored connection/inbound/unhandled lines so a phone session reads like a
 * packet diary ([CLIENT] every id decoded). Outbound packets are logged by the
 * Writer itself (src/byte-stream/writer.js).
 */

const { log } = require('../utils/logger');

function createRequestLogger() {
  return {
    connection(ip, event) {
      log(`\x1b[36m[DEBUG] Client ${event}! IP: ${ip}\x1b[39m`);
    },

    inbound(ip, packetId, name, length) {
      log(`\x1b[94m[CLIENT] IP: ${ip}, PacketID: ${packetId}, Name: ${name}, Length: ${length}\x1b[39m`);
    },

    unhandled(packetId, length) {
      log(`\x1b[36m[CLIENT] Unhandled Packet! ID: ${packetId}, Length: ${length}\x1b[39m`);
    },
  };
}

module.exports = { createRequestLogger };