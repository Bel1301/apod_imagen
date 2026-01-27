export default async function handler(req, res) {
  try {
    const date = (req.query?.date || req.body?.date || "").toString().trim();
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Falta NASA_API_KEY" });
    }

    const url = new URL("https://api.nasa.gov/planetary/apod");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("thumbs", "true"); // miniatura para videos
    if (date) url.searchParams.set("date", date);

    const r = await fetch(url.toString());
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Error NASA", nasa: data });
    }

    // 👉 Página oficial APOD (siempre existe)
    const apodPageUrl = data.date
      ? `https://apod.nasa.gov/apod/ap${data.date.replaceAll('-', '').slice(2)}.html`
      : null;

    // 👉 Recurso real (imagen HD o video)
    const assetUrl = data.hdurl || data.url || null;

    return res.status(200).json({
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      media_type: data.media_type,

      // originales
      url: data.url,
      hdurl: data.hdurl || null,
      thumbnail_url: data.thumbnail_url || null,

      // ✅ NUEVOS (los que te faltaban)
      apod_page_url: apodPageUrl,
      asset_url: assetUrl
    });

  } catch (e) {
    return res.status(500).json({ error: "Error interno" });
  }
}
