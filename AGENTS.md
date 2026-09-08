# AGENTS.md

Node.js server/emulator for the Brawl Stars network protocol. Plain CommonJS (`"type": "commonjs"`, `require()` — do not add ESM imports). No TypeScript, no build step for the server.

## Commands
- `npm run start` — run the game server (TCP :9339).
- `npm run dev` — nodemon watching `src/` and `config/`.
- `npm run check` — the structural gate == `bash -n` + `node --check` + `smoke` + `lint` (see `scripts/checker.sh`).
- `npm test` — the behavior/unit suite (`test/unit/`, node:test, requires Node >=18).
- `npm run test:integration` — live TCP suite (`test/integration/`): boots an in-process server on an ephemeral port + a temp DB and drives real sockets.
- `npm run verify` — `check && test` (unit-level gate; integration is opt-in).
- `npm run smoke` — legacy alias for the structural trio `config-smoke && packets-smoke && db-smoke` (one step inside `check`).
- `npm run lint` — ESLint (`eslint:recommended`, `no-unused-vars` exempts `args`, so unused args are fine).
- `npm run migrate` — apply SQL in `migrations/` (also runs automatically at boot).
- No typecheck exists.

## Adding a packet (the recurring task)
1. Create the class in `src/protocol/messages/client/` (inbound) or `src/protocol/messages/server/` (outbound). Inherit from `ClientMessage`/`ServerMessage` as appropriate.
2. Every client message needs `decode()` and `process(ctx)` (packets-smoke asserts both). In `process`, replies are sent by instantiating server messages and calling `.send()`, or via the `ctx.reply()`/`ctx.log` toolbox shortcuts.
3. Register it in the id map at `src/protocol/logicLaserMessageFactory.js` (`packets`). Client packets use 4-digit ids; server messages set `this.id`.
4. Turn commands go in `src/protocol/commands/` and are registered in `src/protocol/logicCommandManager.js` (`commandExists()` is smoke-tested).
5. Run `npm test` and `npm run check` afterward — the factory + command registrations are asserted by the smoke step, and any new server message is packed and round-tripped by `test/unit/messages.test.js`.

## Conventions and gotchas
- `process(ctx)` receives a per-request toolbox built by `src/tcp/context.js` (`createMessageContext`): `{ client, player, ip, packetId, db, rooms, logger, log, reply }`. `ctx.db` is the repo, `ctx.rooms` the RoomRegistry — destructure what you need at the top of `process` (`const { db, rooms } = ctx;`). Use repo methods with the snake_case API from `src/db/repo/sqlite.js` (e.g. `load_player_account`, `update_player_account`), never raw SQL in features. `ctx.reply(ServerMessageClass, ...args)` builds + sends against this request's client/player; cross-account pushes (friend/team notify) construct the message explicitly.
- Config is loaded via `config/default.js`: `config/config.json` → `GAME_DEFAULTS` (only anchors what the file omits). No `.env`/dotenv anymore — edit `config/config.json` for server config. `process.env.DB_FILE` is still honored so the smoke/test suites can point at a temp DB.
- `scripts/db-smoke.js` sets `process.env.DB_FILE` to a temp path **before** `require('../config/default')` — keep that ordering if touching it. The node:test suites in `test/unit/` and `test/integration/` follow the same rule (each file runs in its own process).
- DB is sqlite (`better-sqlite3`) at `data/accounts.db` (gitignored). Schema lives in `migrations/`; changing it means adding a new versioned SQL file, not editing `0001_init.sql` history.
- Framing: 7-byte header (u16 packet id + u24 length), see `src/tcp/framing.js`. Router/dispatch flow in `src/tcp/router.js`.

## Code comments
- The codebase is intentionally comment-light: no doc-comments on every method, no decorative banners, and no narration of obvious lines (`this.id = 24101` needs no comment).
- Block comments are reserved for the small `/** ... */` header some files carry on top to name the module/packet (e.g. `OWN HOME DATA (24101) — …`). Add one only when it gives future readers orientation the code alone doesn't.
- Use `//` inline sparingly, and only for the *why*: porting quirks (e.g. `player.js`: "Python class attributes are instance-visible…"), CSV/wire coupling (the `brawlers_unlocked` note), or an empty `catch` body (`// pass`). Never restate what the code does.
- Comments are English-only.

## Client APK build (not for running the server)
- `BASE_APK=/path/to/original.apk ./tools/build-client.sh` → `dist/ragnarstars-signed.apk`. The original Brawl Stars APK lives at `tools/apks/brawlstars.apk` (`*.apk` is gitignored, so it's present on this machine but not committed) and is required for the build.
- The base APK is merged (off-repo) from the split bundle `tools/apkmerge/brawlstars.apkm` via the vendored `apkmerge` tool (`npm test` + `node bin/apkmerge.js <file>.apkm --list` to inspect). `tools/apkmerge` is ESM (`"type": "module"`), so `scripts/checker.sh` excludes it from the CommonJS `node --check` pass — don't convert it to CommonJS.
- There is no byte-identical `.script.so` regression guard in the client build anymore (removed 2026-09-22): `tools/build-client.sh` ships the baked gadget script as-is.
- `tools/gadget/krtl-gadget.js` has **no hardcoded libg.so offsets**; both `CREATE_MESSAGE_BY_TYPE` and the server-connection slot are resolved on-device by `tools/gadget/resolver.js`, which `tools/gadget/bake-script.js` embeds ahead of the gadget template in the `.script.so`. Build time only runs offline sanity checks. `krtl-gadget.js` is the one allowed PT-BR file; `resolver.js`/`resolver-check.js`/`bake-script.js` comments must stay English.

## General rules
- Inspect existing code before implementing new behavior.
- Prefer minimal changes that follow established project patterns.
- Do not rewrite working subsystems unless explicitly requested.
- Do not invent packet IDs, message formats, database methods,
  or configuration keys; verify them in the codebase.
- Keep protocol, database, networking, and game logic responsibilities
  in their existing layers.
- Update documentation when changing architecture or established behavior.
- Before modifying any existing file, back it up under `.backups/`,
  grouped by task using a descriptive kebab-case directory name
    (e.g. `.backups/20260917-robustez-gadget/`).
- Preserve the original directory structure inside each backup.
- Never overwrite an existing backup; create a unique task directory
  when necessary.
- New files do not require backups.
- Never claim tests, builds, or client compatibility were verified
  unless they were actually tested.

## Reference docs
- `docs/LEIAUTE.md` — authoritative project layout and network flow (who calls whom).
- `docs/client-build.md` — APK build details and failure causes.
- `game-map.json` — machine-readable inventory of brawlers/skins/cards/packets/commands; brawler/skin ids come from `assets/csv-logic/`.
