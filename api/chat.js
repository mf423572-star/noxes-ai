import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // terima semua variasi nama biar gak kosong
    const body = req.body || {};
    const userMessage = body.message || body.prompt || body.text || body.input || "";

    if (!userMessage) {
      return res.status(200).json({ reply: "BREE INPUT LU KOSONG! Frontend ngirim: " + JSON.stringify(body) });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: userMessage,
    });

    const reply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "Masih kosong bree";

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "OTAK KESANDUNG: " + e.message });
  }
}
