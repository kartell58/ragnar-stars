/**
 * Base class of every server->client reply. Extends the Writer buffer encoder
 * (so subclasses only implement encode()), stashes the player being served and
 * relies on `this.id` being set per class — that id becomes the frame header
 * id. Handlers build one of these and call .send() (confirmed in packets-smoke
 * as the "server messages without this.id" warning).
 */

const { Writer } = require('../../../byte-stream/writer');

class ServerMessage extends Writer {
  constructor(client, player) {
    super(client);
    this.player = player;
  }
}

module.exports = { ServerMessage };