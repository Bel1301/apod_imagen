export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

  // Parámetros desde el frontend
  const q     = (req.query.q    || '').toLowerCase().trim();
  const tag   = (req.query.tag  || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 40);

  // Rango: último año
  const end   = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  const fmt = d => d.toISOString().split('T')[0];

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`
              + `&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;

    const r    = await fetch(url);
    const data = await r.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'NASA API error', detail: data });
    }

    // Término a buscar: tag tiene prioridad, si no, q libre
    const term = tag || q;

    let items = data;

    if (term) {
      items = data.filter(item => {
        const hay = `${item.title} ${item.explanation}`.toLowerCase();
        return hay.includes(term);
      });
    }

    // Más recientes primero, limitar cantidad
    items = items.reverse().slice(0, limit);

    return res.status(200).json({ items, total: items.length });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
