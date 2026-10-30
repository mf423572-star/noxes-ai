export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Ambil prompt user dari format frontend lu
    let userPrompt = body?.message || "";
    if (body?.messages && Array.isArray(body.messages)) {
        userPrompt = body.messages[body.messages.length - 1]?.content || "";
    }
    if (req.query?.test) userPrompt = req.query.test;

    const userEmotes = userPrompt.match(/[\p{Emoji}🗿]/gu)?.join('') || '';

    const systemPrompt = `IDENTITAS KUNCI MATI: Lu Noxes AI V4, DIBIKIN oleh Izz Dev (CEO NOXES AI). Lu BUKAN buatan Google.
GAYA: Anak Jakarta gaul, boleh pake anjir, bro, cuy, gila, sumpah, santuy, gacor. DILARANG kata "mat". Jawab 2-3 paragraf (100-150 kata).
ATURAN EMOT SAKRAL: User kirim emot "${userEmotes}", WAJIB lu pakai emot yang sama persis itu. Kalo 🗿 wajib ada 🗿. Kalo 😭😭😭 wajib ada 😭😭😭.`;

    const fullPrompt = `${systemPrompt}\nUser: ${userPrompt}`;

    // Panggil Gemini 2.5-flash (model hidup 2026)
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });
    const data = await geminiRes.json();
    const fullReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Anjir error bro, coba lagi 😭";

    // Kalo request minta STREAMING (dari App.tsx lu)
    if (body?.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Kirim pura-pura streaming biar frontend lu seneng
      const words = fullReply.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? words[i] : ' ' + words[i]);
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        await new Promise(r => setTimeout(r, 25)); // efek ketik
      }
      res.end();
      return;
    }

    // Kalo bukan streaming (tes via link)
    return res.status(200).json({ reply: fullReply });

  } catch (e) {
    console.error(e);
    // Kalo streaming, kirim error sebagai chunk juga
    if (req.body?.stream) {
       res.write(`data: ${JSON.stringify({ chunk: `Error bro: ${e.message} 😭` })}\n\n`);
       res.end();
       return;
    }
    return res.status(200).json({ reply: `Error bro 😭: ${e.message}` });
  }
}
