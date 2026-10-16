/**
 * Serverless API Route: /api/heath
 * Direct alias for /api/health to satisfy endpoint convention
 */

import handler, { GET, checkHealth } from './health';

export { GET, checkHealth };
export default handler;
