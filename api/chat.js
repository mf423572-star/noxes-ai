import { GoogleGenAI } from "@google/genai";
export default async function handler(req, res) {
  try {
    const { message } = req.body;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message,
    });
    return res.status(200).json({ reply: result.text });
  } catch (e) {
    return res.status(200).json({ reply: "OTAK KESANDUNG: " + e.message });
  }
}
