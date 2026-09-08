/**
 * SELECT SKIN  (turn) — equip a skin: backs out the owning brawler from the
 * skin sheets, updates home brawler/skin + the per-brawler SelectedSkins map,
 * and refreshes default star power/gadget.
 */

const { Cards } = require('../../../files/csv-logic/cards');
const { Characters } = require('../../../files/csv-logic/characters');

class LogicSelectSkinCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.skinID = this.readDataReference()[1];
  }

  process(ctx) {
    const { db } = ctx;
    const cards = new Cards();
    const characters = new Characters();

    const brawler = characters.get_brawler_by_skin_id(this.skinID);
    if (brawler !== undefined) {
      this.player.home_brawler = brawler;
    }

    this.player.home_skin = this.skinID;
    this.player.selected_skins[String(this.player.home_brawler)] = this.skinID;

    db.update_player_account(this.player.token, 'HomeBrawler', this.player.home_brawler);
    db.update_player_account(this.player.token, 'SelectedBrawler', this.player.home_brawler);
    db.update_player_account(this.player.token, 'HomeSkin', this.player.home_skin);
    db.update_player_account(this.player.token, 'SelectedSkins', this.player.selected_skins);

    this.player.starpower = cards.get_spg_by_brawler_id(this.player.home_brawler, 4);
    db.update_player_account(this.player.token, 'StarPower', this.player.starpower);

    this.player.gadget = cards.get_spg_by_brawler_id(this.player.home_brawler, 5);
    db.update_player_account(this.player.token, 'Gadget', this.player.gadget);
  }
}

module.exports = { LogicSelectSkinCommand };