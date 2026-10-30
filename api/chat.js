export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const q = body?.message || req.query?.message || req.query?.test || "halo";
    const userEmotes = q.match(/[\p{Emoji}🗿]/gu)?.join('') || '';

    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const prompt = `
IDENTITAS: Lu Noxes AI V4, dibikin & dirilis oleh Izz Dev (CEO NOXES AI). Lu BUKAN buatan Google.
GAYA: Anak Jakarta gaul, kata boleh: anjir, bro, cuy, gila, sumpah, santuy, gacor. DILARANG kata kasar "mat". Jawab 2-3 paragraf (100-150 kata), jangan 1 baris.
ATURAN EMOT SAKRAL: User kirim emot "${userEmotes}", lu WAJIB pakai emot yang sama persis itu di jawaban lu. Kalo user kirim 🗿 lu wajib ada 🗿. Kalo 😭😭😭 lu wajib ada 😭😭😭. Kalo user gak kirim emot, baru boleh pakai 1 emot netral.
User: ${q}
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await geminiRes.json();
    console.log(JSON.stringify(data));

    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!reply) {
      reply = `Anjir error nih bro 🗿 data mentah: ${JSON.stringify(data).slice(0,300)}`;
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: `Waduh error bro 🗿: ${e.message}` });
  }
                                                                               }
