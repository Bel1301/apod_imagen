const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache de 1 hora en CDN de Vercel — clave para no reventar el rate limit
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const NASA_KEY = process.env.NASA_API_KEY;
  if (!NASA_KEY) {
    return res.status(500).json({ error: 'Falta NASA_API_KEY en las variables de entorno de Vercel' });
  }

  const q     = (req.query.q || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 40);

  // Buscar en los últimos 365 días para tener resultados reales
  const end   = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const fmt = d => d.toISOString().split('T')[0];

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;

    const { status, body } = await httpsGet(url);

    // NASA devuelve error con status 429 (rate limit) o 400
    if (status === 429) {
      return res.status(429).json({ error: 'Límite de la API de NASA alcanzado. Intentá en unos minutos.' });
    }
    if (!Array.isArray(body)) {
      console.error('NASA error:', JSON.stringify(body));
      return res.status(502).json({ error: 'Error de NASA API', detail: body?.msg || body?.error_message || 'Respuesta inesperada' });
    }

    // Filtrar por query si viene
    let items = q
      ? body.filter(item =>
          `${item.title} ${item.explanation}`.toLowerCase().includes(q)
        )
      : body;

    // Más recientes primero, limitado
    items = items.reverse().slice(0, limit);

    return res.status(200).json({ items, total: items.length });

  } catch(e) {
    console.error('Gallery handler error:', e.message);
    return res.status(500).json({ error: 'Error interno: ' + e.message });
  }
};
