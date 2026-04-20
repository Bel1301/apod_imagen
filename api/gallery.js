const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    });
    // Timeout de 8 segundos para no pasarse del límite de Vercel
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Timeout consultando NASA'));
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const NASA_KEY = process.env.NASA_API_KEY;
  if (!NASA_KEY) {
    return res.status(500).json({ error: 'Falta NASA_API_KEY en variables de entorno' });
  }

  const q     = (req.query.q || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 20);

  
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const fmt = d => d.toISOString().split('T')[0];

  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;

    const { status, body } = await httpsGet(url);

    if (status === 429) {
      return res.status(429).json({ error: 'Límite de NASA API alcanzado. Esperá unos minutos.' });
    }
    if (status !== 200 || !Array.isArray(body)) {
      return res.status(502).json({
        error: 'Error de NASA: ' + (body?.msg || body?.error_message || `status ${status}`)
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
    return res.status(500).json({ error: e.message });
  }
};
