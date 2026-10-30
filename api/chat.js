import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();
  if(req.method==="GET") return res.status(200).json({ok:true, key:!!process.env.GEMINI_API_KEY});

  try{
    const {message} = req.body;
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

    // INI MODEL YANG LU PASANG DI AI STUDIO = FLASH LITE LATEST
    const MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash-lite", "gemini-flash-lite-latest", "gemini-1.5-flash"];

    for(const modelId of MODELS){
      try{
        const resp = await ai.models.generateContent({
          model: modelId,
          contents: [{role:"user", parts:[{text: message}]}],
          config: { systemInstruction: "Kamu Noxes AI buatan Izz Dev. Jawab gaul pake bree. Jangan bilang kamu Google." }
        });
        const text = resp.text;
        if(text) return res.status(200).json({reply: text, model: modelId});
      }catch(e){ 
        console.log(`Model ${modelId} gagal:`, e.message);
        continue; 
      }
    }
    throw new Error("Semua model flash-lite sibuk");

  }catch(e){
    return res.status(500).json({reply: `Waduh error: ${e.message} bree`, error: e.message});
  }
}
