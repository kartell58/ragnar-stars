/**
 * LOGIN  (10101) — the session handshake.
 *
 * Decodes the credentials+client info the gadget sends (account id/token,
 * game version, fingerprint sha) and gates the session:
 *   - maintenance on      -> LoginFailed 10
 *   - patch fingerprint   -> LoginFailed 7
 *   - id == 0             -> brand-new account (random id/token, created)
 *   - existing id         -> ban check (code 11) then load_account (backfilled
 *                            if missing columns) plus the player's club row.
 * On success the player is marked status 3 and the client gets LoginOk +
 * OwnHomeData + FriendList (+ club block: MyAlliance / AllianceWar /
 * AllianceStream when a club is set).
 */

const { ClientMessage } = require('./clientMessage');

class LoginMessage extends ClientMessage {
  constructor(client, player, initialBytes) {
    super(client, player, initialBytes);
    this.helpers = null;
  }

  decode() {
    this.account_id = this.readLong();
    this.account_token = this.readString();
    this.game_major = this.readInt();
    this.game_minor = this.readInt();
    this.game_build = this.readInt();
    this.fingerprint_sha = this.readString();
  }

  process(ctx) {
    const { db } = ctx;
    const { LoginOkMessage } = require('../server/loginOkMessage');
    const { LoginFailedMessage } = require('../server/loginFailedMessage');
    const { OwnHomeDataMessage } = require('../server/ownHomeDataMessage');
    const { MyAllianceMessage } = require('../server/myAllianceMessage');
    const { FriendListMessage } = require('../server/friendListMessage');
    const { AllianceStreamMessage } = require('../server/allianceStreamMessage');
    const { AllianceWarMessage } = require('../server/allianceWarMessage');
    const { Helpers } = require('../../../utils/helpers');

    if (this.player.status === 3) return;

    if (this.player.maintenance) {
      this.player.err_code = 10;
      ctx.reply(LoginFailedMessage, null);
      return;
    }

    if (this.fingerprint_sha !== this.player.patch_sha && this.player.patch) {
      this.player.err_code = 7;
      ctx.reply(LoginFailedMessage, null);
      return;
    }

    if (this.account_id === 0) {
      this.player.ID = Helpers.randomID();
      this.player.token = Helpers.randomToken();
      db.create_player_account(this.player.ID, this.player.token);
    } else {
      this.player.ID = this.account_id;
      this.player.token = this.account_token;

      if (db.is_player_banned(this.player.ID)) {
        this.player.err_code = 11;
        ctx.reply(LoginFailedMessage, 'Account banned!');
        return;
      }

      let player_data = db.load_player_account(this.player.token);

      if (!player_data) {
        db.create_player_account(this.player.ID, this.player.token);
        player_data = db.load_player_account(this.player.token);
      }

      if (player_data) {
        Helpers.load_account(this, player_data);
        const club_data = db.load_club(this.player.club_id);
        Helpers.load_club(this, club_data);
      } else {
        this.player.err_code = 1;
        ctx.reply(LoginFailedMessage, 'Account not found in database!\nPlease clear app data.');
        return;
      }
    }

    this.player.client_version = `${this.game_major}.${this.game_minor}.${this.game_build}`;

    this.player.status = 3;
    ctx.reply(LoginOkMessage, this.player.ID, this.player.token);
    ctx.reply(OwnHomeDataMessage);
    ctx.reply(FriendListMessage, db);

    if (this.player.club_id !== 0) {
      const club_data = db.load_club(this.player.club_id);
      ctx.reply(MyAllianceMessage, club_data);
      if (this.player.clubWarsEnabled) ctx.reply(AllianceWarMessage);
      ctx.reply(AllianceStreamMessage, club_data['Messages']);
    }
  }
}

module.exports = { LoginMessage };