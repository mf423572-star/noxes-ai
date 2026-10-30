import { GoogleGenAI } from "@google/genai";
export default async function handler(req, res) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const q = req.body?.message || req.query?.test || "halo";
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: q,
    });
    const reply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text || "KOSONG LAGI";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(200).json({ reply: "ERROR: " + e.message });
  }
}
