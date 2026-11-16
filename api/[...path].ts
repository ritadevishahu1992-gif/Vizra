import { getVercelApp } from '../server';

/**
 * Vercel Serverless Function catch-all bridge for /api/* and scheduled /api/cron/omnia-sync.
 * Note: Persistent /live WebSocket streaming requires a stateful Node runtime rather than stateless HTTP serverless.
 */
export default async function handler(req: any, res: any) {
  const app = await getVercelApp();
  return app(req, res);
}
