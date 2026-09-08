/**
 * SELECT CHARACTER  (turn) — equip the home brawler from the profile/team
 * screen: persists HomeBrawler/SelectedBrawler/HomeSkin and re-derives the
 * brawler's DEFAULT star power and gadget from the cards sheet.
 */

const { Cards } = require('../../../files/csv-logic/cards');

class LogicSelectCharacterCommand {
  decode() {
    this.readVInt();
    this.readVInt();
    this.readLogicLong();
    this.brawler_id = this.readDataReference()[1];
  }

  process(ctx) {
    const { db } = ctx;
    const cards = new Cards();
    const brawler_id = String(this.brawler_id);
    this.player.home_brawler = this.brawler_id;
    this.player.home_skin = this.player.selected_skins[brawler_id] !== undefined ? this.player.selected_skins[brawler_id] : 0;

    db.update_player_account(this.player.token, 'HomeBrawler', this.player.home_brawler);
    db.update_player_account(this.player.token, 'SelectedBrawler', this.player.home_brawler);
    db.update_player_account(this.player.token, 'HomeSkin', this.player.home_skin);

    this.player.starpower = cards.get_spg_by_brawler_id(this.player.home_brawler, 4);
    db.update_player_account(this.player.token, 'StarPower', this.player.starpower);

    this.player.gadget = cards.get_spg_by_brawler_id(this.player.home_brawler, 5);
    db.update_player_account(this.player.token, 'Gadget', this.player.gadget);
  }
}

module.exports = { LogicSelectCharacterCommand };