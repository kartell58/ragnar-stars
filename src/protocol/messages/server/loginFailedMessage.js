/**
 * LOGIN FAILED  (20103) — the kick on a rejected login. Carries the player's
 * err_code (10 maintenance, 7 fingerprint, 11 ban…) in the header field; for
 * patch codes (7/8) the FULL fingerprint string is embedded so the client
 * offers the configured patch/update URLs instead of just erroring.
 */

const { ServerMessage } = require('./serverMessage');
const { Fingerprint } = require('../../../utils/fingerprint');

class LoginFailedMessage extends ServerMessage {
  constructor(client, player, msg) {
    super(client, player);
    this.id = 20103;
    this.msg = msg;
    this.fingerprint = Fingerprint.loadFingerFull('assets/fingerprint.json');

    if (this.player.err_code === 7 || this.player.err_code === 8) {
      this.isPatching = true;
    } else {
      this.isPatching = false;
    }
  }

  encode() {
    this.writeInt(this.player.err_code);

    if (this.isPatching) {
      this.writeString(this.fingerprint);
    } else {
      this.writeString();
    }

    this.writeString();
    this.writeString(this.player.patch_url);
    this.writeString(this.player.update_url);

    this.writeString(this.msg);

    this.writeInt(this.player.maintenance_time);
    this.writeBoolean(false);

    this.writeString();
    this.writeString();

    this.writeInt(0);
    this.writeInt(3);

    this.writeString();
    this.writeString();

    this.writeInt(0);
    this.writeInt(0);

    this.writeBoolean(false);
    this.writeBoolean(false);
  }
}

module.exports = { LoginFailedMessage };