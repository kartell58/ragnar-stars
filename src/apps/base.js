/**
 * Shared application context: the single config, the shared repo and the three
 * cross-cutting middleware (logger/security/errorHandler). Both the game server
 * and the admin daemon build their stack on top of this.
 */

const config = require('../../config/default');
const { getRepo } = require('../db/repo');
const { createRequestLogger } = require('../middleware/requestLogger');
const { createSecurity } = require('../middleware/security');
const { createErrorHandler } = require('../middleware/errorHandler');

function createBaseContext() {
  const db = getRepo();
  return {
    config,
    db,
    logger: createRequestLogger(),
    security: createSecurity(config),
    errorHandler: createErrorHandler(),
  };
}

module.exports = { createBaseContext };