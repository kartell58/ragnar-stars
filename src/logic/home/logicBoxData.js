/**
 * Brawl-box opener. randomize() rolls rewards for a box the client opens; the
 * `type` selects the payout tier (10 -> smallest, 12 -> mid, 11 -> biggest).
 * Each tier mixes: a chance of a NEW brawler, guaranteed gold, power points
 * for already-unlocked brawlers and token-doubler/gem bonuses. Every change is
 * persisted through the repo immediately (brawler lists, resources, gems). The
 * repo handle rides the encode-time `self` (the AvailableServerCommandMessage,
 * which now carries an optional 4th ctor arg) — it no longer leaks through the
 * player. The box_rewards structure is echoed back as LogicBoxData in a
 * CommandEffect.
 */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LogicBoxData = {
  randomize(self, type) {
    self.box_rewards = { Rewards: [] };

    if (type === 10) {
      let check = false;

      if (randomInt(0, 100) < 20) {
        const locked_brawlers = sortedSetDiff(self.player.brawlers_id, self.player.brawlers_unlocked);
        if (locked_brawlers.length) {
          const brawler = randomChoice(locked_brawlers);
          const brawler_reward = { Amount: 1, DataRef: [16, brawler], Value: 1 };
          self.box_rewards['Rewards'].push(brawler_reward);
          if (!self.player.brawlers_unlocked.includes(brawler)) {
            self.player.brawlers_unlocked.push(brawler);
            self.db.update_player_account(self.player.token, 'UnlockedBrawlers', self.player.brawlers_unlocked);
          }
          check = true;
        }
      }

      if (randomInt(0, 100) < 100 && !check) {
        const gold_value = randomInt(20, 100);
        const gold_reward = { Amount: gold_value, DataRef: [0, 0], Value: 7 };
        self.box_rewards['Rewards'].push(gold_reward);
        self.player.resources[1]['Amount'] = self.player.resources[1]['Amount'] + gold_value;
        self.db.update_player_account(self.player.token, 'Resources', self.player.resources);
        const rewarded = [];
        for (let x = 0; x < 1; x++) {
          const pp_value = randomInt(5, 30);
          const brawler = randomChoice(sortedSetDiff(self.player.brawlers_unlocked, rewarded));
          if (self.player.brawlers_level[String(brawler)] < 8) {
            const pp_reward = { Amount: pp_value, DataRef: [16, brawler], Value: 6 };
            self.box_rewards['Rewards'].push(pp_reward);
            self.player.brawlers_powerpoints[String(brawler)] = self.player.brawlers_powerpoints[String(brawler)] + pp_value;
            self.db.update_player_account(self.player.token, 'BrawlersPowerPoints', self.player.brawlers_powerpoints);
            rewarded.push(brawler);
          }
        }
      }

      if (randomInt(0, 100) < 20 && !check) {
        const locked_brawlers = sortedSetDiff(self.player.brawlers_id, self.player.brawlers_unlocked);
        if (locked_brawlers.length) {
          const brawler = randomChoice(locked_brawlers);
          const brawler_reward = { Amount: 1, DataRef: [16, brawler], Value: 1 };
          self.box_rewards['Rewards'].push(brawler_reward);
          if (!self.player.brawlers_unlocked.includes(brawler)) {
            self.player.brawlers_unlocked.push(brawler);
            self.db.update_player_account(self.player.token, 'UnlockedBrawlers', self.player.brawlers_unlocked);
          }
        }
      }

      if (randomInt(0, 100) < 30) {
        const bonus = randomChoice([2, 8]);
        let bonus_value;
        if (bonus === 8) {
          bonus_value = randomInt(5, 15);
          self.player.gems = self.player.gems + bonus_value;
          self.db.update_player_account(self.player.token, 'Gems', self.player.gems);
        } else {
          bonus_value = randomInt(20, 50);
          self.player.token_doubler = self.player.token_doubler + bonus_value;
          self.db.update_player_account(self.player.token, 'TokenDoubler', self.player.token_doubler);
        }
        const bonus_reward = { Amount: bonus_value, DataRef: [0, 0], Value: bonus };
        self.box_rewards['Rewards'].push(bonus_reward);
      }
    } else if (type === 12) {
      if (randomInt(0, 100) < 100) {
        const gold_value = randomInt(50, 150);
        const gold_reward = { Amount: gold_value, DataRef: [0, 0], Value: 7 };
        self.box_rewards['Rewards'].push(gold_reward);

        self.player.resources[1]['Amount'] = self.player.resources[1]['Amount'] + gold_value;
        self.db.update_player_account(self.player.token, 'Resources', self.player.resources);

        let rewarded = [];
        const n = [1, 2].includes(self.player.brawlers_unlocked.length)
          ? self.player.brawlers_unlocked.length
          : randomChoice([2, 3]);
        for (let x = 0; x < n; x++) {
          const pp_value = randomInt(30, 50);
          const brawler = randomChoice(sortedSetDiff(self.player.brawlers_unlocked, rewarded));
          if (self.player.brawlers_level[String(brawler)] < 8) {
            const pp_reward = { Amount: pp_value, DataRef: [16, brawler], Value: 6 };
            self.box_rewards['Rewards'].push(pp_reward);
            self.player.brawlers_powerpoints[String(brawler)] = self.player.brawlers_powerpoints[String(brawler)] + pp_value;
            self.db.update_player_account(self.player.token, 'BrawlersPowerPoints', self.player.brawlers_powerpoints);
            rewarded.push(brawler);
          }
        }
      }

      if (randomInt(0, 100) < 35) {
        const locked_brawlers = sortedSetDiff(self.player.brawlers_id, self.player.brawlers_unlocked);
        if (locked_brawlers.length) {
          const brawler = randomChoice(locked_brawlers);
          const brawler_reward = { Amount: 1, DataRef: [16, brawler], Value: 1 };
          self.box_rewards['Rewards'].push(brawler_reward);
          if (!self.player.brawlers_unlocked.includes(brawler)) {
            self.player.brawlers_unlocked.push(brawler);
            self.db.update_player_account(self.player.token, 'UnlockedBrawlers', self.player.brawlers_unlocked);
          }
        }
      }

      if (randomInt(0, 100) < 40) {
        const bonus = randomChoice([2, 8]);
        let bonus_value;
        if (bonus === 8) {
          bonus_value = randomInt(10, 20);
          self.player.gems = self.player.gems + bonus_value;
          self.db.update_player_account(self.player.token, 'Gems', self.player.gems);
        } else {
          bonus_value = randomInt(40, 80);
          self.player.token_doubler = self.player.token_doubler + bonus_value;
          self.db.update_player_account(self.player.token, 'TokenDoubler', self.player.token_doubler);
        }
        const bonus_reward = { Amount: bonus_value, DataRef: [0, 0], Value: bonus };
        self.box_rewards['Rewards'].push(bonus_reward);
      }
    } else if (type === 11) {
      if (randomInt(0, 100) < 100) {
        const gold_value = randomInt(100, 500);
        const gold_reward = { Amount: gold_value, DataRef: [0, 0], Value: 7 };
        self.box_rewards['Rewards'].push(gold_reward);

        self.player.resources[1]['Amount'] = self.player.resources[1]['Amount'] + gold_value;
        self.db.update_player_account(self.player.token, 'Resources', self.player.resources);

        const n = [1, 2, 3, 4].includes(self.player.brawlers_unlocked.length)
          ? self.player.brawlers_unlocked.length
          : randomChoice([4, 5]);
        const rewarded = [];
        for (let x = 0; x < n; x++) {
          const pp_value = randomInt(50, 150);
          const brawler = randomChoice(sortedSetDiff(self.player.brawlers_unlocked, rewarded));
          if (self.player.brawlers_level[String(brawler)] < 8) {
            const pp_reward = { Amount: pp_value, DataRef: [16, brawler], Value: 6 };
            self.box_rewards['Rewards'].push(pp_reward);
            self.player.brawlers_powerpoints[String(brawler)] = self.player.brawlers_powerpoints[String(brawler)] + pp_value;
            self.db.update_player_account(self.player.token, 'BrawlersPowerPoints', self.player.brawlers_powerpoints);
            rewarded.push(brawler);
          }
        }
      }

      if (randomInt(0, 100) < 55) {
        const locked_brawlers = sortedSetDiff(self.player.brawlers_id, self.player.brawlers_unlocked);
        if (locked_brawlers.length) {
          const brawler = randomChoice(locked_brawlers);
          const brawler_reward = { Amount: 1, DataRef: [16, brawler], Value: 1 };
          self.box_rewards['Rewards'].push(brawler_reward);
          if (!self.player.brawlers_unlocked.includes(brawler)) {
            self.player.brawlers_unlocked.push(brawler);
            self.db.update_player_account(self.player.token, 'UnlockedBrawlers', self.player.brawlers_unlocked);
          }
        }
      }

      if (randomInt(0, 100) < 50) {
        const bonus = randomChoice([2, 8]);
        let bonus_value;
        if (bonus === 8) {
          bonus_value = randomInt(10, 50);
          self.player.gems = self.player.gems + bonus_value;
          self.db.update_player_account(self.player.token, 'Gems', self.player.gems);
        } else {
          bonus_value = randomInt(100, 400);
          self.player.token_doubler = self.player.token_doubler + bonus_value;
          self.db.update_player_account(self.player.token, 'TokenDoubler', self.player.token_doubler);
        }
        const bonus_reward = { Amount: bonus_value, DataRef: [0, 0], Value: bonus };
        self.box_rewards['Rewards'].push(bonus_reward);
      }
    }

    return self.box_rewards;
  },
};

function sortedSetDiff(a, b) {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x)).sort((x, y) => x - y);
}

module.exports = { LogicBoxData };