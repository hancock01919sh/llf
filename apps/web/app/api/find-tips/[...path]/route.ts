import { clientIp, createDefaultApp, loadConfig } from '@llf/find-my-tips';

/*
 * Thin wrapper around the tool's Request → Response handler (BD3244-87, TDD D36). All tool logic
 * stays in `services/find-my-tips`; this file only builds the app once per server process and
 * supplies the client IP, resolved through the same trusted-proxy hops as the Node adapter.
 */
export const runtime = 'nodejs';
// The app loads its catalog on first use, so the build needs no tool env (TDD D36).
export const dynamic = 'force-dynamic';

function build() {
  const config = loadConfig();
  return {
    app: createDefaultApp(config),
    // No socket address here. The proxy chain always sets `x-forwarded-for` in front of the web
    // service, so `unknown` only applies to a request that bypasses it.
    ip: (req: Request) => clientIp(req, 'unknown', config.trustedProxyHops),
  };
}

let current: ReturnType<typeof build> | undefined;

function state(): ReturnType<typeof build> {
  return (current ??= build());
}

export async function GET(req: Request): Promise<Response> {
  const { app, ip } = state();
  return app.handle(req, { ip: ip(req) });
}

export async function POST(req: Request): Promise<Response> {
  const { app, ip } = state();
  return app.handle(req, { ip: ip(req) });
}
