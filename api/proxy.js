export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint, ...params } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint parameter' });

  const token = process.env.SPORTMONKS_TOKEN;
  if (!token) return res.status(500).json({ error: 'SPORTMONKS_TOKEN not configured in environment' });

  // Try both possible Sportmonks base URLs
  const bases = [
    'https://api.sportmonks.com/v3/football',
    'https://api.sportmonks.com/api/v3/football',
  ];

  for (const base of bases) {
    try {
      const url = new URL(base + endpoint);
      url.searchParams.set('api_token', token);
      Object.entries(params).forEach(([k, v]) => {
        if (k !== 'endpoint') url.searchParams.set(k, v);
      });

      const response = await fetch(url.toString());
      const data = await response.json();

      if (response.status === 401 || response.status === 404) continue;

      return res.status(response.status).json(data);
    } catch (err) {
      continue;
    }
  }

  return res.status(502).json({ error: 'All Sportmonks endpoints failed' });
}
