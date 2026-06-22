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

  // Rango de fechas: una sola consulta bulk (rápida y fiable).
  // El parámetro `count` de NASA trae N días aleatorios uno por uno y es
  // demasiado lento (supera el timeout). Un rango se resuelve en una query.
  // Últimos 30 días para que sea bien rápido.
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const fmt = d => d.toISOString().split('T')[0];

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`
      + `&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;

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

    // Más recientes primero
    items = items.reverse().slice(0, limit);

    return res.status(200).json({ items, total: items.length });

  } catch(e) {
    console.error('Gallery error:', e.message);
    const aborted = e.name === 'AbortError' || e.name === 'TimeoutError';
    return res.status(aborted ? 504 : 500).json({
      error: aborted ? 'NASA tardó demasiado en responder. Probá de nuevo.' : 'Internal error'
    });
  }
}
