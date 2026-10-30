import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-lite-latest"
    });
    
    const result = await model.generateContent(message);
    const reply = result.response.text();

    return res.status(200).json({ reply: reply });

  } catch (e) {
    return res.status(200).json({ reply: "ERROR ASLI: " + e.message });
  }
}
