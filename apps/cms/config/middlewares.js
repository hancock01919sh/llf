module.exports = ({ env }) => [
  {
    // TDD §5.4: everything except /api/*, /uploads/* and /_health is limited to
    // ADMIN_IP_ALLOWLIST. Enforced by default in production, where an empty list blocks the admin.
    name: 'global::admin-ip-allowlist',
    config: {
      allowlist: env('ADMIN_IP_ALLOWLIST', ''),
      header: env('ADMIN_IP_HEADER', 'x-forwarded-for'),
      trustedHops: env.int('ADMIN_IP_TRUSTED_HOPS', 1),
      enforce: env.bool('ADMIN_IP_ENFORCE', env('NODE_ENV') === 'production'),
    },
  },
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
