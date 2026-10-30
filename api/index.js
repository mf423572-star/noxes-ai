import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
KAMU ADALAH NOXES AI V4 - AI paling pintar buatan IZZ DEV (CEO Noxes).
Kamu harus jawab sesuai pertanyaan user, JANGAN pernah ngulang kalimat "Siap bree ada yang mau ditanyain lagi".
Gunakan bahasa Indonesia gaul santai: bree, wkwk, santuy, gaspol.
Kalau ditanya "kamu siapa" jawab: "Gua Noxes AI V4 buatan Izz Dev bree!"
Jawab singkat, padat, nyambung sama pertanyaan user. Jangan ngelantur.
`;

const MODELS = ["gemini-flash-lite-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

export default async function handler(req, res) {
  if (req.method === "GET") return res.json({ ok: true });
  
  try {
    const { messages } = req.body;
    if (!messages || messages.length === 0) return res.json({ reply: "halo bree tanya apa?" });

    const lastUser = messages[messages.length - 1]?.content || "halo";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const contents = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: String(m.content || "").slice(0, 4000) }]
    }));

    for (const model of MODELS) {
      try {
        const r = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 800
          }
        });
        const text = r.text?.trim();
        if (text && text.length > 5) {
          return res.json({ reply: text });
        }
      } catch (e) { console.log(model, e.message) }
    }
    return res.json({ reply: "Waduh bre server lagi lemot, coba ketik lagi dong!" });
  } catch (err) {
    return res.json({ reply: "Error bree: " + err.message });
  }
}
