module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Public origin, e.g. the Render URL. Empty locally.
  url: env('PUBLIC_URL', ''),
  // Behind Render's TLS proxy, Koa must trust X-Forwarded-Proto or secure admin cookies fail.
  proxy: { koa: env.bool('IS_PROXIED', false) },
  app: {
    keys: env.array('APP_KEYS'),
  },
});
