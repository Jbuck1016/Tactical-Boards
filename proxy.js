export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const token = process.env.SPORTMONKS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'SPORTMONKS_TOKEN not configured in environment' });
  }

  // Build Sportmonks URL
  const url = new URL(`https://api.sportmonks.com/v3/football${endpoint}`);
  url.searchParams.set('api_token', token);
  Object.entries(params).forEach(([k, v]) => {
    if (k !== 'endpoint') url.searchParams.set(k, v);
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    // Forward rate limit headers
    const rl = response.headers.get('x-ratelimit-remaining');
    if (rl) res.setHeader('X-RateLimit-Remaining', rl);

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Sportmonks proxy error:', err);
    return res.status(502).json({ error: 'Failed to fetch from Sportmonks', detail: err.message });
  }
}
