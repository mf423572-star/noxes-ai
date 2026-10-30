export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let userPrompt = body?.message || "";
    if (body?.messages) userPrompt = body.messages[body.messages.length-1]?.content || "";
    if (req.query?.test) userPrompt = req.query.test;

    const userEmotes = userPrompt.match(/[\p{Emoji}🗿]/gu)?.join('') || '';
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const fullPrompt = `IDENTITAS: Lu Noxes AI V4 by Izz Dev (CEO NOXES AI). Lu BUKAN Google.
GAYA: Anak Jakarta gaul, anjir, bro, cuy, gacor. DILARANG kata kasar "mat". Jawab 2-3 paragraf.
ATURAN EMOT: User kirim "${userEmotes}", lu WAJIB pakai emot sama persis itu. Kalo 🗿 wajib ada 🗿.
User: ${userPrompt}`;

    // MODEL BARU YANG DIMINTA GOOGLE DI ERROR LU
    const MODEL = "gemini-3.8-flash";

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
    });
    const j = await r.json();
    let fullReply = j?.candidates?.[0]?.content?.parts?.[0]?.text || `Error Google masih: ${JSON.stringify(j).slice(0,500)} 🗿`;

    if (body?.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      for (const word of fullReply.split(' ')) {
        res.write(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`);
        await new Promise(r=>setTimeout(r,15));
      }
      res.end(); return;
    }
    return res.status(200).json({ reply: fullReply });

  } catch (e) {
    const msg = `FATAL: ${e.message} 🗿`;
    res.setHeader('Content-Type','text/event-stream');
    res.write(`data: ${JSON.stringify({ chunk: msg })}\n\n`);
    res.end();
  }
}
