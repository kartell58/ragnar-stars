/**
 * CHANGE MEMBER SETTINGS  (14354) — equips a cosmetic from the team screen.
 * A data-ref family 29 (skin) sets the home brawler + home skin and derives
 * default star power/gadget via the cards sheet; family 23 (star power or
 * gadget id) branches by card type and persists the picked ability. Always
 * re-sends TeamMessage so teammates see the new loadout.
 */

const { ClientMessage } = require('./clientMessage');
const { TeamMessage } = require('../server/teamMessage');
const { Cards } = require('../../../files/csv-logic/cards');
const { Characters } = require('../../../files/csv-logic/characters');

class TeamChangeMemberSettingsMessage extends ClientMessage {
  decode() {
    this.data_ref = this.readDataReference();
    if (this.data_ref[0] === 0) {
      this.data_ref = this.readDataReference();
    }
  }

  process(ctx) {
    const { db } = ctx;
    const cards = new Cards();
    const characters = new Characters();

    if (this.data_ref[0] === 29) {
      this.player.home_brawler = characters.get_brawler_by_skin_id(this.data_ref[1]);
      this.player.home_skin = this.data_ref[1];
      this.player.starpower = cards.get_spg_by_brawler_id(this.player.home_brawler, 4);
      this.player.gadget = cards.get_spg_by_brawler_id(this.player.home_brawler, 5);
    } else if (this.data_ref[0] === 23) {
      const type = cards.check_spg_id(this.data_ref[1]);
      if (type === '4') {
        this.player.starpower = this.data_ref[1];
      } else if (type === '5') {
        this.player.gadget = this.data_ref[1];
      }

      db.update_player_account(this.player.token, 'StarPower', this.player.starpower);
      db.update_player_account(this.player.token, 'Gadget', this.player.gadget);
    }

    ctx.reply(TeamMessage);
  }
}

module.exports = { TeamChangeMemberSettingsMessage };