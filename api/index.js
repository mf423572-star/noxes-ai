import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Kamu adalah NOXES AI V4 - AI super cerdas buatan Ceo Noxes Ai yaitu Izz Dev. Ngomong santai gaul pake bahasa Indonesia bre, wkwk, santuy, jangan formal. Jawab singkat padat tapi jelas.`;

const MODELS = ["gemini-flash-lite-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ status: "NOXES API OK, use POST /api/chat" });
  }

  try {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ reply: "BRE API KEY BELUM KEPASANG DI VERCEL! Masuk ke Vercel > Settings > Environment Variables > Add GEMINI_API_KEY" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "halo" }]
    }));

    for (const model of MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.85,
          }
        });
        const text = result.text;
        if (text) {
          return res.json({ reply: text });
        }
      } catch (e) {
        console.log(`Model ${model} gagal:`, e.message);
      }
    }

    return res.json({ reply: "anjir bre koneksi nyangkut, coba lagi ya!" });

  } catch (err) {
    console.error(err);
    return res.json({ reply: `Error server: ${err.message}` });
  }
          }
