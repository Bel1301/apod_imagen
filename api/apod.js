export default async function handler(req, res) {
  try {
    const date = (req.query?.date || req.body?.date || "").toString().trim();
    const apiKey = process.env.NASA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Falta NASA_API_KEY" });
    }

    const url = new URL("https://api.nasa.gov/planetary/apod");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("thumbs", "true"); // 👈 CLAVE para videos
    if (date) url.searchParams.set("date", date);

    const r = await fetch(url.toString());
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "Error NASA", nasa: data });
    }

    // Devolvemos todo lo necesario para imagen o video
    return res.status(200).json({
      date: data.date,
      title: data.title,
      explanation: data.explanation,
      media_type: data.media_type, // image | video
      url: data.url,               // imagen o video (youtube/vimeo)
      hdurl: data.hdurl || null,   // solo cuando es imagen
      thumbnail_url: data.thumbnail_url || null // 👈 ahora sí viene para video
    });
  } catch (e) {
    return res.status(500).json({ error: "Error interno" });
  }
}
