import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash","gemini-1.5-flash-8b"];

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS") return res.status(200).end();

  // INI BUAT CEK API KEY
  if(req.method==="GET"){
    return res.status(200).json({ok:true, key: !!process.env.GEMINI_API_KEY, env: Object.keys(process.env).filter(k=>k.includes("GEMINI"))});
  }

  if(req.method!=="POST") return res.status(405).json({error:"Use POST"});
  
  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) return res.status(500).json({reply:"GEMINI_API_KEY belum di pasang di Vercel Settings bree! Pasang dulu!"});

  try{
    const {message, history=[]} = req.body;
    if(!message) return res.status(400).json({error:"No message"});

    const ai = new GoogleGenAI({apiKey});
    const cleanHistory = (history||[]).slice(-8).map(h=>({role:h.role==="user"?"user":"model", parts:[{text:h.text||""}]}));
    
    for(const modelId of MODELS){
      try{
        const chat = ai.chats.create({model:modelId, config:{systemInstruction:"Kamu adalah Noxes A.I, asisten buatan CEO Noxes AI yaitu Izz Dev bree. Jangan pernah bilang kamu buatan Google atau Gemini. Jawab pake bahasa santai bree, gaul, singkat. Jangan pernah ngulang jawaban yang sama! Kalo ditanya siapa kamu, jawab kamu adalah Noxes AI buatan Izz Dev."}, history: cleanHistory});
        const result = await chat.sendMessage({message});
        const text = result.text;
        if(text) return res.status(200).json({reply:text});
      }catch(e){ continue; }
    }
    return res.status(500).json({reply:"Semua model Gemini lagi sibuk bree, coba lagi 5 detik!"});
  }catch(e){
    return res.status(500).json({reply:"Error: "+e.message});
  }
}
