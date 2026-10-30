import { GoogleGenAI } from "@google/genai";
export default async function handler(req,res){
res.setHeader("Access-Control-Allow-Origin","*");
res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
res.setHeader("Access-Control-Allow-Headers","Content-Type");
if(req.method==="OPTIONS") return res.status(200).end();
if(req.method==="GET") return res.status(200).json({ok:true,key:!!process.env.GEMINI_API_KEY});
try{
let b=req.body; if(!b||typeof b==='string'){let d=''; try{d=typeof b==='string'?b:await new Promise(r=>{let x='';req.on('data',c=>x+=c);req.on('end',()=>r(x));});}catch{} try{b=JSON.parse(d||'{}')}catch{b={}}}
let m=b.message||b.prompt||""; if(!m) return res.status(200).json({reply:"Kirim pesan dong bree!"});
let ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
let r=await ai.models.generateContent({model:"gemini-1.5-flash",contents:m,config:{systemInstruction:"Kamu Noxes AI buatan Izz Dev. Jawab gaul pake bree."}});
return res.status(200).json({reply:r.text});
}catch(e){return res.status(200).json({reply:"ERROR ASLI: "+e.message});}
}
