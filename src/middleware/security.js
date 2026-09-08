/**
 * Gatekeeper run before any packet is decoded: a static ban set (BannedIPs
 * from config) plus a per-IP sliding-window rate limit (60 packets / 10s).
 * Blocks return { code: 11 } which the router turns into a LoginFailed instead
 * of dropping the socket.
 */

const RATE_WINDOW_MS = 10000;
const RATE_MAX = 60;

function createSecurity(config) {
  const banned = new Set((config.game.BannedIPs || []).map(String));
  const hits = new Map();

  function check(ip) {
    const key = String(ip);
    if (banned.has(key)) return { allowed: false, code: 11, reason: 'banned' };

    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.t > RATE_WINDOW_MS) {
      hits.set(key, { t: now, n: 1 });
      return { allowed: true };
    }
    entry.n += 1;
    if (entry.n > RATE_MAX) return { allowed: false, code: 11, reason: 'rate-limit' };
    return { allowed: true };
  }

  function reset(ip) {
    hits.delete(String(ip));
  }

  return { check, reset };
}

module.exports = { createSecurity };