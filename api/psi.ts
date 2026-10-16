/**
 * Serverless API Route: /api/psi
 * Endpoint: GET https://api-open.data.gov.sg/v2/real-time/api/psi
 * No API key required
 * Compatible with serverless environments (Node.js/Express, Vercel, Netlify, Cloud Functions)
 */

export interface OpenDataGovPsiResponse {
  code: number;
  data: {
    regionMetadata: Array<{
      name: string;
      labelLocation: {
        latitude: number;
        longitude: number;
      };
    }>;
    items: Array<{
      date: string;
      updatedTimestamp: string;
      timestamp: string;
      readings: {
        psi_twenty_four_hourly: Record<string, number>;
        pm25_twenty_four_hourly: Record<string, number>;
        pm10_twenty_four_hourly: Record<string, number>;
        so2_twenty_four_hourly: Record<string, number>;
        no2_one_hour_max: Record<string, number>;
        co_eight_hour_max: Record<string, number>;
        o3_eight_hour_max: Record<string, number>;
        [key: string]: Record<string, number> | undefined;
      };
    }>;
  };
  errorMsg?: string;
}

const DATA_GOV_PSI_URL = 'https://api-open.data.gov.sg/v2/real-time/api/psi';

/**
 * Core fetch function to pull live data from data.gov.sg
 */
export async function getPsiData(): Promise<OpenDataGovPsiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(DATA_GOV_PSI_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Singapore-HazeWatch/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Upstream data.gov.sg returned HTTP ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as OpenDataGovPsiResponse;
    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Web Standard Request/Response Handler (Next.js / Edge / Cloudflare Workers style)
 */
export async function GET(request?: Request): Promise<Response> {
  try {
    const data = await getPsiData();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        code: 500,
        error: err.message || 'Failed to fetch PSI data from data.gov.sg',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * Standard Node.js / Express Serverless Function Handler
 */
export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  try {
    const data = await getPsiData();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(502).json({
      code: 502,
      error: err.message || 'Failed to fetch upstream PSI data from data.gov.sg',
      upstreamEndpoint: DATA_GOV_PSI_URL,
      timestamp: new Date().toISOString(),
    });
  }
}
