/**
 * Serverless API Route: /api/health
 * Health check & upstream connectivity status
 */

const UPSTREAM_ENDPOINT = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

export async function checkHealth() {
  let upstreamReachable = false;
  let upstreamLatencyMs = 0;

  try {
    const start = Date.now();
    const res = await fetch(UPSTREAM_ENDPOINT, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Singapore-HazeWatch/1.0' },
    });
    upstreamLatencyMs = Date.now() - start;
    upstreamReachable = res.ok || res.status === 200 || res.status === 405;
  } catch {
    upstreamReachable = false;
  }

  return {
    status: 'ok',
    service: 'singapore-psi-serverless-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : undefined,
    upstream: {
      endpoint: UPSTREAM_ENDPOINT,
      keyRequired: false,
      reachable: upstreamReachable,
      latencyMs: upstreamLatencyMs,
    },
  };
}

export async function GET(request?: Request): Promise<Response> {
  const healthData = await checkHealth();
  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(200).end();
  }

  const healthData = await checkHealth();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json(healthData);
}
