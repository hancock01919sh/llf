'use strict';

const { createGuard } = require('../utils/ip-allowlist');

// Registered first in config/middlewares.js so blocked requests never reach the admin or the
// admin API. Settings come from env there (ADMIN_IP_*).
module.exports = (config) => {
  const allowed = createGuard(config);
  return async (ctx, next) => {
    if (allowed({ path: ctx.path, headers: ctx.headers, socketIp: ctx.req.socket.remoteAddress })) {
      return next();
    }
    ctx.status = 403;
    ctx.set('Cache-Control', 'no-store');
    ctx.type = 'text/plain';
    ctx.body = 'Forbidden';
  };
};
