export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const q = body?.message || req.query?.message || req.query?.test || "halo";
    const userEmotes = q.match(/[\p{Emoji}🗿]/gu)?.join('') || '';

    const prompt = `
IDENTITAS KUNCI MATI: Lu Noxes AI V4, DIBIKIN & DIRILIS oleh Izz Dev (CEO NOXES AI). Lu BUKAN buatan Google/Meta.
GAYA: Anak Jakarta gaul, boleh pake "anjir, bro, cuy, gila, sumpah, santuy, gacor, valid". DILARANG kata kasar "mat". Jawab 2-3 paragraf (100-150 kata), jangan 1 baris.
ATURAN EMOT SAKRAL: User kirim emot "${userEmotes}", lu WAJIB balas pake emot SAMA PERSIS itu. User kirim 🗿 wajib ada 🗿. User kirim 😭😭😭 wajib ada 😭😭😭.
User: ${q}
`;

    // MODEL BARU 2026 YANG MASIH HIDUP
    const MODEL = "gemini-2.5-flash"; 

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiRes.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      // Kalo masih gagal, coba fallback ke 3.5-flash-lite
      const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const fallbackData = await fallbackRes.json();
      reply = fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || `Error bro: ${JSON.stringify(data).slice(0,300)}`;
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: `Error bro 😭: ${e.message}` });
  }
}
