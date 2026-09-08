/**
 * Smoke-test for the protocol registries (runs under `npm run smoke`).
 *
 * Asserts, in order:
 *   - the message factory loaded at least one packet and EVERY packet exposes
 *     both decode() and process() — a packet missing one would crash dispatch;
 *   - a sample of client + server turn commands resolve cleanly through
 *     LogicCommandManager (commandExists + non-empty name), and the number of
 *     registered commands in [200, 600) is reported;
 *   - server messages that never set `this.id` are warned about (they are
 *     constructed directly by handlers, so the missing id is informational).
 * Prints a small summary (packet / command / file counts) when green.
 * Note: this file is also imported by no one — run it, not require() it.
 */

const fs = require('node:fs');
const path = require('node:path');

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const ROOT = path.join(__dirname, '..');

try {
  const { packets } = require('../src/protocol/logicLaserMessageFactory');

  const ids = Object.keys(packets);
  assert(ids.length > 0, 'no packets registered in the factory');

  for (const id of ids) {
    const cls = packets[id];
    assert(typeof cls === 'function', `packet ${id}: class is not a function`);
    assert(typeof cls.prototype.decode === 'function', `packet ${id}: missing decode()`);
    assert(typeof cls.prototype.process === 'function', `packet ${id}: missing process()`);
  }

  const { LogicCommandManager } = require('../src/protocol/logicCommandManager');
  const sampleClients = [210, 500, 504, 505, 506, 509, 519, 520, 521, 522, 525, 527];
  const sampleServers = [201, 202, 203, 204, 205, 206, 207, 208, 209, 211, 212, 213, 214, 215, 216];
  for (const id of sampleClients.concat(sampleServers)) {
    assert(LogicCommandManager.commandExists(id), `command ${id} not registered`);
    assert(LogicCommandManager.getCommandName(id).length > 0, `getCommandName(${id}) is empty`);
  }
  const commandCount = (() => {
    let n = 0;
    for (let id = 200; id < 600; id += 1) {
      if (LogicCommandManager.commandExists(id)) n += 1;
    }
    return n;
  })();

  const clientDir = path.join(ROOT, 'src/protocol/messages/client');
  const serverDir = path.join(ROOT, 'src/protocol/messages/server');
  const missingId = [];
  for (const file of fs.readdirSync(serverDir).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(serverDir, file), 'utf8');
    if (!/this\.id\s*=/.test(src)) missingId.push(file);
  }

  if (missingId.length) {
    console.warn(`[packets-smoke] server messages without this.id (ignored): ${missingId.join(', ')}`);
  }

  console.log('[packets-smoke] OK');
  console.log('  client packets:', ids.length);
  console.log('  commands      :', commandCount);
  console.log('  server dir    :', fs.readdirSync(serverDir).filter((f) => f.endsWith('.js')).length, 'files');
  console.log('  client dir    :', fs.readdirSync(clientDir).filter((f) => f.endsWith('.js')).length, 'files');
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  process.exit(1);
}