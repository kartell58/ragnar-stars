/**
 * LOGIN OK  (20104) — the green light, sent right after successful 10101.
 * Reproduces the real handshake payload: the account id (twice), its token and
 * the exact client version + `dev` env markers, then the maintenance/foo
 * strings and the player's region; the trailing empty field groups are part of
 * the original layout and must stay.
 */

const { ServerMessage } = require('./serverMessage');

class LoginOkMessage extends ServerMessage {
  constructor(client, player, account_id, account_token) {
    super(client, player);
    this.account_id = account_id;
    this.account_token = account_token;
    this.id = 20104;
  }

  encode() {
    this.writeLong(this.account_id);
    this.writeLong(this.account_id);

    this.writeString(this.account_token);
    this.writeString();
    this.writeString();

    this.writeInt(26);
    this.writeInt(184);
    this.writeInt(1);

    this.writeString('dev');

    this.writeInt(0);
    this.writeInt(0);
    this.writeInt(0);

    this.writeString();
    this.writeString();
    this.writeString();

    this.writeInt(0);

    this.writeString();
    this.writeString(this.player.region);
    this.writeString();

    this.writeInt(1);
    this.writeString();

    this.writeInt(2);
    this.writeString();
    this.writeString();

    this.writeInt(1);
    this.writeString();
  }
}

module.exports = { LoginOkMessage };