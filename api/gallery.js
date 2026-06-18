export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const NASA_KEY = process.env.NASA_API_KEY;
  if (!NASA_KEY) {
    return res.status(500).json({ error: 'Falta NASA_API_KEY en variables de entorno' });
  }

  const q = (req.query.q || '').toString().slice(0, 100).toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 20);

  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  const fmt = d => d.toISOString().split('T')[0];

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;

    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const body = await r.json();

    if (r.status === 429) {
      return res.status(429).json({ error: 'Límite de NASA API alcanzado. Esperá unos minutos.' });
    }
    if (!Array.isArray(body)) {
      return res.status(502).json({
        error: 'Error de NASA: ' + (body?.msg || body?.error_message || `status ${r.status}`)
      });
    }

    let items = q
      ? body.filter(item =>
          `${item.title} ${item.explanation}`.toLowerCase().includes(q)
        )
      : body;

    items = items.reverse().slice(0, limit);

    return res.status(200).json({ items, total: items.length });

  } catch(e) {
    console.error('Gallery error:', e.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
