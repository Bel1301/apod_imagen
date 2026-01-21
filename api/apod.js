export default async function handler(req, res) {
  try {
    const date = (req.query?.date || req.body?.date || "").toString().trim();
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Falta NASA_API_KEY" });
    }

    const url = new URL("https://api.nasa.gov/planetary/apod");
    url.searchParams.set("api_key", apiKey);
    if (date) url.searchParams.set("date", date);

    const r = await fetch(url.toString());
    const data = await r.json();

    return res.status(200).json({
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      media_type: data.media_type,
      url: data.url,
      hdurl: data.hdurl || null
    });
  } catch (e) {
    return res.status(500).json({ error: "Error interno" });
  }
}
