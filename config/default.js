const fs = require('node:fs');
const path = require('node:path');

const GAME_DEFAULTS = {
  ClubWarsEnabled: false,
  StarPoints: 999999,
  Tickets: 999999,
  Gold: 999999,
  Gems: 999999,
  Trophies: 0,
  ExperiencePoints: 999999,
  BrawlBoxTokens: 999999,
  BigBoxTokens: 999999,
  Region: 'BR',
  ThemeID: 0,
  ContentCreatorCodes: ['Kartell'],
  BannedIPs: [],
  Maintenance: false,
  SecondsTillMaintenanceOver: 3600,
  Patch: false,
  PatchURL: 'http://192.168.0.101:8080/',
  UpdateURL: '',
};

// config.json is the single source of truth; GAME_DEFAULTS only anchor what it omits
let fileConf = {};
try {
  fileConf = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
} catch (e) {
  // config.json missing — fall back to the defaults below
}

const _root = (p) => path.resolve(__dirname, '..', p);
const _port = (p) => (Number.isInteger(p) ? p : 9339);

const game = { ...GAME_DEFAULTS, ...(fileConf.Game || {}) };

// DB_FILE stays env-driven: the smoke suites and unit/integration tests point
// it at a temp database before requiring this module
const DB_FILE = process.env.DB_FILE || _root((fileConf.Database && fileConf.Database.File) || 'data/accounts.db');

module.exports = {
  env: fileConf.Environment || 'development',
  logLevel: fileConf.LogLevel || 'info',
  net: {
    host: (fileConf.Server && fileConf.Server.Host) || '0.0.0.0',
    port: _port(fileConf.Server && fileConf.Server.Port),
  },
  db: {
    file: DB_FILE,
  },
  migrations: {
    dir: path.join(__dirname, '..', 'migrations'),
  },
  game,
};
