export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const date = (req.query?.date || "").toString().trim();
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Falta NASA_API_KEY en las variables de entorno de Vercel' });
    }

    async function fetchApod(dateStr) {
      const url = new URL('https://api.nasa.gov/planetary/apod');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('thumbs', 'true');
      if (dateStr) url.searchParams.set('date', dateStr);

      const r = await fetch(url.toString());
      const data = await r.json();
      return { ok: r.ok, status: r.status, data };
    }

    function buildResponse(data, usedFallback) {
      const apodPageUrl = data.date
        ? `https://apod.nasa.gov/apod/ap${data.date.replaceAll('-', '').slice(2)}.html`
        : null;
      return {
        date: data.date,
        title: data.title,
        explanation: data.explanation,
        media_type: data.media_type,
        url: data.url,
        hdurl: data.hdurl || null,
        thumbnail_url: data.thumbnail_url || null,
        apod_page_url: apodPageUrl,
        asset_url: data.hdurl || data.url || null,
        fallback: usedFallback || false,
      };
    }

    const first = await fetchApod(date);

    if (first.ok) {
      // Cache 1 hora si es fecha específica, 5 min si es "hoy" (puede actualizarse)
      const cacheTime = date ? 3600 : 300;
      res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate=60`);
      return res.status(200).json(buildResponse(first.data, false));
    }

    // Rate limit de NASA
    if (first.status === 429) {
      return res.status(429).json({ error: 'Límite de NASA API alcanzado. Esperá unos minutos.' });
    }

    // Fallback a ayer solo si no era fecha específica
    if (!date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const second = await fetchApod(yStr);
      if (second.ok) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
        return res.status(200).json(buildResponse(second.data, true));
      }
    }

    return res.status(first.status).json({
      error: first.data?.msg || first.data?.error_message || 'Error de NASA',
    });

  } catch (e) {
    console.error('APOD handler error:', e.message);
    return res.status(500).json({ error: 'Error interno: ' + e.message });
  }
}
