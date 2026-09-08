const { Fingerprint } = require('../utils/fingerprint');
const { Characters } = require('../files/csv-logic/characters');
const { Skins } = require('../files/csv-logic/skins');
const { Cards } = require('../files/csv-logic/cards');
const config = require('../../config/default');

const settings = config.game;

const skins_id = new Skins().get_skins_id();
const brawlers_id = new Characters().get_brawlers_id();

const selected_skins = {};
for (const id of brawlers_id) selected_skins[String(id)] = 0;

// Every CSV-defined brawler starts unlocked — never hardcode ids here, or the
// brawler maps (trophies/level/power points, built from the same sheet) and the
// OwnHomeData avatar encoder will desync and crash on a phantom id.
const brawlers_unlocked = brawlers_id.slice();

const resources = [
  { ID: 1, Amount: settings['BrawlBoxTokens'] },
  { ID: 8, Amount: settings['Gold'] },
  { ID: 9, Amount: settings['BigBoxTokens'] },
  { ID: 10, Amount: settings['StarPoints'] },
];

const def_trophies = 0;
const def_high_trophies = 99999;
const def_level = 9;
const def_pp = 99999;

const brawlers_trophies = {};
for (const x of brawlers_id) brawlers_trophies[String(x)] = def_trophies;
const brawlers_high_trophies = {};
for (const x of brawlers_id) brawlers_high_trophies[String(x)] = def_high_trophies;
const brawlers_level = {};
for (const x of brawlers_id) brawlers_level[String(x)] = def_level;
const brawlers_powerpoints = {};
for (const x of brawlers_id) brawlers_powerpoints[String(x)] = def_pp;

class Player {
  constructor(device) {
    this.device = device;
  }
}

// Python class attributes are instance-visible; JS mirrors that via the prototype.
const P = Player.prototype;

P.settings = settings;
P.skins_id = skins_id;
P.brawlers_id = brawlers_id;
P.ID = 0;
P.token = null;
P.trophies = settings['Trophies'];
P.tickets = settings['Tickets'];
P.gems = settings['Gems'];
P.resources = resources;
P.high_trophies = settings['Trophies'];
P.trophy_reward = 1;
P.exp_points = settings['ExperiencePoints'];
P.profile_icon = 0;
P.name_color = 0;
P.selected_brawler = 0;
P.region = settings['Region'];
P.content_creator = 'Kartell';
P.content_creator_codes = settings['ContentCreatorCodes'];
P.name_set = false;
P.name = 'Guest';
P.map_id = 0;
P.use_gadget = true;
P.starpower = 76;
P.gadget = 255;
P.home_brawler = 0;
P.home_skin = 0;
P.leaderboard_type = 0;
P.leaderboard_is_global = false;
P.bp_activated = false;
P.token_doubler = 0;
P.welcome_msg_viewed = true;
P.theme_id = settings['ThemeID'];
P.maintenance = settings['Maintenance'];
P.maintenance_time = settings['SecondsTillMaintenanceOver'];
P.patch = settings['Patch'];
P.patch_url = settings['PatchURL'];
P.patch_sha = Fingerprint.loadFinger('assets/fingerprint.json');
P.update_url = settings['UpdateURL'];
P.clubWarsEnabled = settings['ClubWarsEnabled'];
P.status = 0;
P.leaderboardData = [];
P.err_code = 0;

P.delivery_items = {};
P.box_rewards = {};
P.battle_tick = 0;

P.unlocked_skins = skins_id;
P.selected_skins = selected_skins;
P.brawlers_unlocked = brawlers_unlocked.slice();

P.brawlers_card_id = [];
P.brawlers_spg = new Cards().get_spg_id();

P.brawlers_trophies = brawlers_trophies;
P.brawlers_high_trophies = brawlers_high_trophies;
P.brawlers_level = brawlers_level;
P.brawlers_powerpoints = brawlers_powerpoints;

P.club_id = 0;
P.club_role = 0;
P.friends = [];
P.message_tick = 0;

module.exports = { Player };