// ANSI color codes used by the legacy console helpers (yellow packet ids,
// reset after each line). Cheap, zero-dependency cosmetics.
const colors = {
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[94m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  lighblue_ex: '\x1b[94m',
  reset: '\x1b[39m',
};

module.exports = colors;