const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
  const q     = (req.query.q    || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit) || 12, 40);

  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const fmt = d => d.toISOString().split('T')[0];

  try {
   const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&start_date=${fmt(start)}&end_date=${fmt(end)}&thumbs=true`;
console.log('Fetching:', url.replace(NASA_KEY, 'KEY_HIDDEN'));
const data = await httpsGet(url);
if (!Array.isArray(data)) {
  console.error('NASA error response:', JSON.stringify(data));
  return res.status(502).json({ error: 'NASA API error', detail: data });
}

    let items = q
      ? data.filter(item => `${item.title} ${item.explanation}`.toLowerCase().includes(q))
      : data;

    items = items.reverse().slice(0, limit);
    return res.status(200).json({ items, total: items.length });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
