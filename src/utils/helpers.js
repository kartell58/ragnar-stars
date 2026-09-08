const fs = require('node:fs');
const crypto = require('node:crypto');
const colors = require('./colors');

const MAX_VALUE = 999999;

const Helpers = {
  connected_clients: { ClientsCount: 0, Clients: {} },

  yellow: colors.yellow,
  green: colors.green,
  blue: colors.blue,
  cyan: colors.cyan,
  red: colors.red,
  reset: colors.reset,

  randomToken() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < 40; i++) out += alphabet[crypto.randomInt(0, alphabet.length)];
    return out;
  },

  randomID(length = 8) {
    let digits = '';
    for (let i = 0; i < length; i++) digits += crypto.randomInt(0, 10).toString();
    return Number(digits);
  },

  randomMapID() {
    return crypto.randomInt(1, MAX_VALUE + 1);
  },

  get_box_type(id) {
    if (id === 5) return 10;
    if (id === 4) return 12;
    if (id === 3) return 11;
    if (id === 1) return 12;
  },

  create_config() {
    const settings = {
      StarPoints: 5000,
      Gold: 10000,
      Gems: 100000,
      Trophies: 0,
      ExperiencePoints: 999999,
      BrawlBoxTokens: 99999,
      BigBoxTokens: 99999,
      Region: 'RO',
      ThemeID: 0,
      Maintenance: false,
      SecondsTillMaintenanceOver: 3600,
    };
    fs.writeFileSync('config.json', JSON.stringify(settings, null, 4));
  },

  load_account(ctx, playerData) {
    const player = ctx.player;

    const FIELDS = [
      ['name_set', 'NameSet'],
      ['name', 'Name'],
      ['trophies', 'Trophies'],
      ['gems', 'Gems'],
      ['resources', 'Resources'],
      ['token_doubler', 'TokenDoubler'],
      ['high_trophies', 'HighestTrophies'],
      ['trophy_reward', 'TrophyRoadReward'],
      ['exp_points', 'ExperiencePoints'],
      ['profile_icon', 'ProfileIcon'],
      ['name_color', 'NameColor'],
      ['brawlers_unlocked', 'UnlockedBrawlers'],
      ['brawlers_trophies', 'BrawlersTrophies'],
      ['brawlers_high_trophies', 'BrawlersHighestTrophies'],
      ['brawlers_level', 'BrawlersLevel'],
      ['brawlers_powerpoints', 'BrawlersPowerPoints'],
      ['unlocked_skins', 'UnlockedSkins'],
      ['selected_skins', 'SelectedSkins'],
      ['tickets', 'Tickets'],
      ['home_brawler', 'SelectedBrawler'],
      ['home_skin', 'HomeSkin'],
      ['region', 'Region'],
      ['content_creator', 'SupportedContentCreator'],
      ['friends', 'Friends'],
      ['club_id', 'ClubID'],
      ['club_role', 'ClubRole'],
    ];

    for (const [key, column] of FIELDS) {
      const value = playerData[column];
      if (value == null) {
        player[key] = Array.isArray(player[key]) ? player[key].slice() : player[key];
      } else {
        player[key] = value;
      }
    }

    player.trophies = MAX_VALUE;
    player.high_trophies = MAX_VALUE;
    player.gems = MAX_VALUE;
    player.exp_points = MAX_VALUE;
    player.tickets = MAX_VALUE;
    for (const resource of player.resources) resource['Amount'] = MAX_VALUE;
  },

  load_club(ctx, clubData) {
    try {
      ctx.player.message_tick = clubData['Messages'][clubData['Messages'].length - 1]['Tick'];
    } catch (e) {
      // pass
    }
  },
};

module.exports = { Helpers, MAX_VALUE };