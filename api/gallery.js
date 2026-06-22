export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const NASA_KEY = process.env.NASA_API_KEY;
  if (!NASA_KEY) {
    return res.status(500).json({ error: 'Missing NASA_API_KEY env variable' });
  }

  const q     = (req.query.q || '').toString().slice(0, 100).toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 20);

  try {
    // Fetch 200 random APODs from the full 30-year archive for broad search coverage
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&count=200&thumbs=true`;

    const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
    const body = await r.json();

    if (r.status === 429) {
      return res.status(429).json({ error: 'NASA API rate limit reached. Please wait a few minutes.' });
    }
    if (!Array.isArray(body)) {
      return res.status(502).json({
        error: 'NASA error: ' + (body?.msg || body?.error_message || `status ${r.status}`)
      });
    }

    let items = q
      ? body.filter(item =>
          `${item.title} ${item.explanation}`.toLowerCase().includes(q)
        )
      : body;

    items = items.slice(0, limit);

    return res.status(200).json({ items, total: items.length });

  } catch(e) {
    console.error('Gallery error:', e.message);
    return res.status(500).json({ error: 'Internal error: ' + e.message });
  }
}
