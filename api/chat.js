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

    if (!GEMINI_KEY) {
        const errMsg = "API KEY KOSONG DI VERCEL BRO!";
        if (body?.stream) {
          res.setHeader('Content-Type','text/event-stream');
          res.write(`data: ${JSON.stringify({ chunk: errMsg })}\n\n`);
          res.end(); return;
        }
        return res.status(200).json({ reply: errMsg });
    }

    const fullPrompt = `Lu Noxes AI V4 by Izz Dev. Gaya gaul Jakarta. Emot wajib samain "${userEmotes}". User: ${userPrompt}`;

    // Coba 3 model berurutan biar salah satu pasti hidup
    const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let fullReply = null;
    let lastError = null;

    for (const MODEL of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
      });
      const j = await r.json();
      if (j?.candidates?.[0]?.content?.parts?.[0]?.text) {
        fullReply = j.candidates[0].content.parts[0].text;
        break;
      } else {
        lastError = JSON.stringify(j).slice(0, 500);
      }
    }

    if (!fullReply) {
      fullReply = `GAGAL NIH BRO. Error Google: ${lastError} 🗿`;
    }

    if (body?.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const words = fullReply.split(' ');
      for (let i=0; i<words.length; i++) {
        const chunk = (i===0 ? words[i] : ' ' + words[i]);
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        await new Promise(r=>setTimeout(r,20));
      }
      res.end(); return;
    }
    return res.status(200).json({ reply: fullReply });

  } catch (e) {
    const msg = `FATAL ERROR: ${e.message} 🗿`;
    if (req.body?.stream) {
      res.setHeader('Content-Type','text/event-stream');
      res.write(`data: ${JSON.stringify({ chunk: msg })}\n\n`);
      res.end(); return;
    }
    return res.status(200).json({ reply: msg });
  }
}
