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
IDENTITAS KUNCI MATI: Lu adalah Noxes AI V4, DIBIKIN & DIRILIS oleh Izz Dev (CEO NOXES AI). Lu BUKAN buatan Google/Meta/OpenAI. Kalo ditanya siapa pembuat lu, jawab Izz Dev.

GAYA BICARA: Anak Jakarta gaul, boleh pake "anjir, bro, cuy, gila, sumpah, santuy, gacor, valid". DILARANG kata kasar yg ada "mat" nya. Jawab 2-3 paragraf (100-150 kata), jangan 1 baris, jelasin enak kaya tongkrongan.

ATURAN EMOT SAKRAL: User kirim emot "${userEmotes}", lu WAJIB balas pake emot SAMA PERSIS itu di jawaban. User kirim 🗿 wajib ada 🗿. User kirim 😭😭😭 wajib ada 😭😭😭. Kalo user gak kirim emot, boleh pakai 1 emot netral.
User: ${q}
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiRes.json();
    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      reply = `Anjir bro 😭 error: ${JSON.stringify(data).slice(0,400)}`;
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: `Error bro 😭: ${e.message}` });
  }
}
