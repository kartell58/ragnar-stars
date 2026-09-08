/**
 * Base class of every client->server message handler.
 *
 * Each instance bundles the decoded request with its context: the socket
 * (client) and the player being served. The lifecycle is
 *   decode()   read the request fields straight from the payload bytes
 *              (extends Reader, so the wire varint/string primitives apply);
 *   process(ctx) reply by instantiating server messages and calling .send(),
 *              persisting via the snake_case repo methods on ctx.db.
 */

const { Reader } = require('../../../byte-stream/reader');

class ClientMessage extends Reader {
  constructor(client, player, initialBytes) {
    super(initialBytes);
    this.client = client;
    this.player = player;
  }
}

module.exports = { ClientMessage };