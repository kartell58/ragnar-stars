/**
 * Admin app assembler: boots the AdminCore (bans, player surgery) from the
 * shared ctx. The `actor` tag labels who performed an action for the audit log.
 */

const { AdminCore } = require('../admin/core');

function createAdminApp(ctx, { actor = 'console' } = {}) {
  const core = new AdminCore({ actor, db: ctx.db });
  return { name: 'admin', config: ctx.config, db: ctx.db, core };
}

module.exports = { createAdminApp };