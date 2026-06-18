export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const dateRaw = (req.query?.date || '').toString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : '';

  const apiKey = process.env.NASA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta NASA_API_KEY' });
  }

  async function fetchApod(dateStr, attempt = 1) {
    const url = new URL('https://api.nasa.gov/planetary/apod');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('thumbs', 'true');
    if (dateStr) url.searchParams.set('date', dateStr);

    try {
      const r = await fetch(url.toString(), {
        signal: AbortSignal.timeout(9000),
        headers: { 'Accept': 'application/json' }
      });

      const text = await r.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          return fetchApod(dateStr, attempt + 1);
        }
        return { ok: false, status: 502, data: { msg: 'NASA no respondió con JSON válido' } };
      }

      return { ok: r.ok, status: r.status, data };

    } catch (e) {
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        return fetchApod(dateStr, attempt + 1);
      }
      return { ok: false, status: 503, data: { msg: e.message } };
    }
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

  try {
    const first = await fetchApod(date);

    if (first.ok) {
      const cacheTime = date ? 3600 : 300;
      res.setHeader('Cache-Control', `s-maxage=${cacheTime}, stale-while-revalidate=60`);
      return res.status(200).json(buildResponse(first.data, false));
    }

    if (first.status === 429) {
      return res.status(429).json({ error: 'Límite de NASA API alcanzado. Esperá unos minutos.' });
    }

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

    return res.status(502).json({ error: 'Error de NASA' });

  } catch (e) {
    console.error('APOD error:', e.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
