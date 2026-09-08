const { Player } = require('../../logic/player');
const { Device } = require('../../logic/device');
const { Helpers } = require('../../utils/helpers');
const { HEADER_LEN, frames } = require('../../tcp/framing');

class ClientThread {
  constructor(client, address, ctx = {}) {
    this.client = client;
    this.address = address;
    this.ip = String(address).replace(/^::ffff:/, '');
    this.ctx = ctx;
    this.router = ctx.router;
    this.logger = ctx.logger;
    this.errorHandler = ctx.errorHandler;
    this.device = new Device(this.client);
    this.player = new Player(this.device);
    this.player.ip = this.ip;
    this._buffer = Buffer.alloc(0);
    this._disconnected = false;
  }

  _disconnect() {
    if (this._disconnected) return;
    this._disconnected = true;
    try {
      this.client.destroy();
    } catch (e) {
      // pass
    }
    if (this.logger) this.logger.connection(this.ip, 'disconnected');
    Helpers.connected_clients['ClientsCount'] -= 1;
    delete Helpers.connected_clients['Clients'][String(this.player.ID)];
  }

  run() {
    this.client.setTimeout(10000, () => {
      this._disconnect();
    });

    this.client.on('data', (chunk) => {
      this._handle(chunk);
    });

    this.client.on('close', () => this._disconnect());
    this.client.on('error', () => this._disconnect());
  }

  _handle(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    const parsed = frames(this._buffer);
    let consumed = 0;

    for (const frame of parsed) {
      consumed += HEADER_LEN + frame.packet_length;
      const ctx = {
        client: this.client,
        player: this.player,
        ip: this.ip,
      };

      try {
        this.router.dispatch(ctx, frame);
      } catch (e) {
        if (this.errorHandler) this.errorHandler.handle(e, { ip: this.ip, packetId: frame.packet_id });
        this._disconnect();
        return;
      }
    }

    this._buffer = this._buffer.subarray(consumed);
  }
}

module.exports = { ClientThread };