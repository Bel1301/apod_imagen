export default async function handler(req, res) {
  try {
    const date = (req.query?.date || req.body?.date || "").toString().trim();
    const apiKey = process.env.NASA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta NASA_API_KEY" });
    }

    async function fetchApod(dateStr) {
      const url = new URL("https://api.nasa.gov/planetary/apod");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("thumbs", "true");
      if (dateStr) url.searchParams.set("date", dateStr);
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
        fallback: usedFallback || false
      };
    }

    // Intento principal
    const first = await fetchApod(date);
    if (first.ok) {
      return res.status(200).json(buildResponse(first.data, false));
    }

    // Si falló y no era una fecha específica del usuario, intentar ayer
    if (!date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const second = await fetchApod(yStr);
      if (second.ok) {
        return res.status(200).json(buildResponse(second.data, true));
      }
    }

    // Si todo falló
    return res.status(first.status).json({ error: "Error NASA", nasa: first.data });

  } catch (e) {
    return res.status(500).json({ error: "Error interno" });
  }
}
