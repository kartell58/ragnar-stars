#!/usr/bin/env node

/**
 * ADMIN CONSOLE — `npm run admin` opens an interactive REPL over AdminCore
 * (users, profiles, hero/skin, sessions, bans, stats, audit…); pass a command
 * inline (`node scripts/admin.js stats`) for one-shot use. Table formatting
 * stays here; all real work lives in src/admin/core.js.
 */

const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');
const { AdminCore } = require('../src/admin/core.js');

const HELP = [
  'commands:',
  '  users | list-users             list users and ban status',
  '  delete-user <name> --yes       delete a user',
  '',
  '  whois <name|id>                show account, friends, clubs and other info',
  '  find <name|id>                 search users and profiles',
  '  profile <name|id>              show profile information',
  '',
  '  create-profile <name>          create a new profile',
  '  delete-profile <id> --yes      delete a profile',
  '  set-hero <id-player> <id-hero> set player hero',
  '  set-skin <id-player> <id-skin> set player skin',
  '',
  '  sessions                       list active sessions',
  '  session <server-id>            show one session',
  '  revoke-session <server-id>     revoke one session',
  '  invalidate <token>             revoke one token without printing it',
  '  revoke <name>                  revoke all tokens and sessions',
  '  kick <name|id> [reason...]     revoke tokens and sessions',
  '',
  '  ban <name|id> [reason...]      ban, revoke and audit an account',
  '  unban <name|id>                remove the ban without creating tokens',
  '  ban-info <name|id>             show ban metadata',
  '  stats                          show live database statistics',
  '  health                         check server, database, storage and sessions',
  '  audit [limit]                  list administrative audit records',
  '',
  '  help / ?                       show this text',
  '  quit / q                       exit the REPL',
  '',
].join('\n');

function extractActor(argv) {
  const index = argv.indexOf('--actor');
  if (index === -1) return undefined;
  const actor = argv[index + 1];
  if (!actor) throw new Error('Missing value for --actor');
  argv.splice(index, 2);
  return actor;
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatWhois(result) {
  if (!result.found) return `not found${result.identifier ? `: ${result.identifier}` : ''}`;
  const lines = [
    'User',
    '──────────────────────',
    `ID          ${result.user.id}`,
    `Name        ${result.user.name}`,
    `Token       ${result.user.token || '-'}`,
    `Trophies    ${result.user.trophies} (high ${result.user.highTrophies})`,
    `Gems        ${result.user.gems}`,
    `Tickets     ${result.user.tickets}`,
    `Exp         ${result.user.exp}`,
    `Hero        ${result.user.hero}${result.user.heroName ? ` (${result.user.heroName})` : ''}`,
    `Skin        ${result.user.skin}${result.user.skinName ? ` (${result.user.skinName})` : ''}`,
    `Brawlers    ${result.user.unlockedBrawlers} unlocked`,
    `Skins       ${result.user.unlockedSkins} unlocked`,
    `Club        ${result.user.clubId}`,
    `Region      ${result.user.region || '-'}`,
    `Banned      ${result.banned ? `yes${result.banReason ? ` (${result.banReason})` : ''}` : 'no'}${result.bannedBy ? ` by ${result.bannedBy}` : ''}`,
    '',
  ];
  if (result.sessions.length) {
    lines.push(`Sessions    ${result.sessions.length}`, '──────────────────────');
    for (const s of result.sessions) {
      lines.push(`  ${s.serverId}  ${s.profileName}  @ ${s.clientIp || '-'}`);
    }
  } else {
    lines.push('Sessions    (none connected)');
  }
  return lines.join('\n');
}

function formatProfile(result) {
  if (!result.found) return `profile not found${result.identifier ? `: ${result.identifier}` : ''}`;
  return [
    `ID          ${result.id}`,
    `Name        ${result.name}`,
    `Token       ${result.token || '-'}`,
    `Trophies    ${result.trophies} (high ${result.highTrophies})`,
    `Gems        ${result.gems}`,
    `Tickets     ${result.tickets}`,
    `Exp         ${result.exp}`,
    `Hero        ${result.hero}${result.heroName ? ` (${result.heroName})` : ''}`,
    `Skin        ${result.skin}${result.skinName ? ` (${result.skinName})` : ''}`,
    `Brawlers    ${result.unlockedBrawlers.length} unlocked`,
    `Skins       ${result.unlockedSkins.length} unlocked`,
    `Club        ${result.clubId} (role ${result.clubRole})`,
    `Region      ${result.region || '-'}`,
    `Created     ${result.createdAt || '-'}`,
    `Banned      ${result.banned ? `yes${result.banReason ? ` (${result.banReason})` : ''}` : 'no'}`,
  ].join('\n');
}

function formatSessions(sessions) {
  if (!sessions.length) return '(no active sessions)';
  return [`${sessions.length} active session${sessions.length === 1 ? '' : 's'}:`, ...sessions.map((session) => `  ${session.serverId}  ${session.profileName}  ${session.username}  @ ${session.clientIp || '-'}`)].join('\n');
}

function formatHealth(health) {
  const line = (label, value) => `${label.padEnd(12)}${value.ok ? 'OK' : 'FAIL'}${value.reason ? ` — ${value.reason}` : ''}`;
  return [line('Process', health.process), line('Database', health.database), line('Storage', health.storage), line('Sessions', health.sessions)].join('\n');
}

function formatStats(stats) {
  return [
    `Players     ${stats.players}`,
    `Clubs       ${stats.clubs}`,
    `Banned      ${stats.banned}`,
    `Connected   ${stats.connected}`,
    `Skins       ${stats.skins}`,
    `Uptime      ${formatDuration(stats.uptime)}`,
  ].join('\n');
}

function formatAudit(records) {
  if (!records.length) return '(no audit records)';
  return records.map((record) => `${record.created_at}  ${record.actor}  ${record.action}  ${record.target_type || '-'}:${record.target_id || '-'}${record.reason ? `  reason=${record.reason}` : ''}`).join('\n');
}

async function dispatch(core, args) {
  const [command, ...rest] = args;
  if (!command) return '';
  switch (command.toLowerCase()) {
    case 'users':
    case 'list-users':
      return formatJson(core.listUsers());
    case 'delete-user':
      return formatJson(core.deleteUser(rest[0], rest.includes('--yes')));
    case 'whois':
      return formatWhois(core.whois(rest[0]));
    case 'find':
      return formatJson(core.find(rest.join(' ')));
    case 'profile':
      return formatProfile(core.profile(rest[0]));
    case 'create-profile':
      return formatJson(core.createProfile(rest[0]));
    case 'delete-profile':
      return formatJson(core.deleteProfile(rest[0], rest.includes('--yes')));
    case 'set-hero':
      return formatJson(core.setHero(rest[0], rest[1]));
    case 'set-skin':
      return formatJson(core.setSkin(rest[0], rest[1]));
    case 'sessions':
      return formatSessions(core.sessions());
    case 'session':
      return formatJson(core.session(rest[0]));
    case 'revoke-session':
      return formatJson(core.revokeSession(rest[0]));
    case 'invalidate':
      return formatJson(core.invalidate(rest[0]));
    case 'revoke':
      return formatJson(core.revoke(rest[0]));
    case 'kick':
      return formatJson(core.kick(rest[0], rest.slice(1).join(' ') || undefined));
    case 'ban':
      return formatJson(core.ban(rest[0], rest.slice(1).join(' ') || undefined));
    case 'unban':
      return formatJson(core.unban(rest[0]));
    case 'ban-info':
      return formatJson(core.banInfo(rest[0]));
    case 'stats':
      return formatStats(core.stats());
    case 'health':
      return formatHealth(await core.health());
    case 'audit':
      return formatAudit(core.auditLog({ limit: rest[0] }));
    case 'help':
    case '--help':
    case '?':
      return HELP;
    default:
      return `unknown command: ${command} (try 'help')`;
  }
}

async function runRepl(core) {
  const rl = readline.createInterface({ input, output, prompt: 'admin> ' });
  console.log('Brawl Stars admin console — type \'help\' for commands, \'quit\' to exit');
  rl.prompt();
  for await (const line of rl) {
    const args = line.trim().split(/\s+/).filter(Boolean);
    const command = args[0]?.toLowerCase();
    if (command === 'quit' || command === 'exit' || command === 'q') {
      rl.close();
      break;
    }
    if (!args.length) {
      rl.prompt();
      continue;
    }
    try {
      const result = await dispatch(core, args);
      if (result) console.log(result);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    rl.prompt();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--web') {
    console.log('The admin web panel is not part of this backend migration. The web/ directory is reserved for the owner’s future React + Vite project.');
    return;
  }
  const actor = extractActor(argv);
  const core = new AdminCore({ actor });
  try {
    if (!argv.length) {
      await runRepl(core);
      return;
    }
    const result = await dispatch(core, argv);
    if (result) console.log(result);
  } catch (error) {
    console.error(`Error: ${error.stack || error.message}`);
    process.exitCode = 1;
  } finally {
    await core.close();
  }
}

main();
