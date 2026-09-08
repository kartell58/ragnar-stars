const fs = require('node:fs');
const config = require('../config/default');
const { rootPath } = require('./utils/paths');
const { createBaseContext } = require('./apps/base');
const { createGameApp } = require('./apps/gameApp');
const { start } = require('./servers/_start');
const { log } = require('./utils/logger');

class Main {
  constructor() {
    this.config = config;
    this.app = null;
  }

  async main() {
    try {
      let ascii = 'RagnarStars';
      try {
        ascii = fs.readFileSync(rootPath('assets/ascii.txt'), 'utf-8');
      } catch (e) {
        // fallback
      }
      console.log(ascii);

      const ctx = createBaseContext();
      this.app = createGameApp(ctx);
      this.app.server.start();
      start(this.app.server, 'game', () => ctx.db.close());
    } catch (e) {
      log(`Encountered exception: ${e}`);
    }
  }
}

function boot() {
  const instance = new Main();
  instance.main();
  return instance;
}

module.exports = { Main, boot };

if (require.main === module) {
  boot();
}