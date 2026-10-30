import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { message } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message,
    });

    // ini anti kosong bree, ambil text dari mana aja yang ada
    const reply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!reply) {
      return res.status(200).json({ reply: "ANJIR KOSONG BREE, result nya: " + JSON.stringify(result).slice(0, 500) });
    }

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "OTAK KESANDUNG: " + e.message });
  }
}
