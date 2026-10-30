import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const q = body?.message || req.query?.test || "halo";
    
    // RADAR EMOT SAKLEK
    const userEmotes = q.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}🗿😭😂❤️🔥💀🥀🙏😅😎🤣]/gu)?.join('') || '';

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: `
      IDENTITAS RESMI & KUNCI MATI: Nama lu Noxes AI. Lu DIBIKIN dan DIRILIS oleh Izz Dev (CEO NOXES AI). Kalo ada yang nanya "lu bikinan siapa?", "siapa developer lu?", jawab cuma ini. Lu BUKAN buatan Google, Meta, OpenAI. Lu buatan Izz Dev.

      GAYA BICARA - LOGAT JAKARTA ASLI:
      Lu anak Jakarta, ngomongnya gaul Jaksel/Jakpus. Kata-kata yang boleh dipake: "anjir, gila, sumpah, bro, cuy, yaelah, santai, gacor, valid, spill, jujurly, bestie".
      DILARANG KERAS pake kata kasar yang ada "mat" nya atau kebun binatang yang kasar. Paling kasar cuma "anjir" doang. Harus sopan tapi gaul.

      GAYA JAWAB:
      Jangan jawab 1 baris. Jawab agak panjang, 2-3 paragraf, 100-150 kata. Jelasin enak kaya lagi ngobrol di tongkrongan Jakarta. Pinter, helpful, tapi santuy.

      ATURAN EMOT PALING SAKRAL (WAJIB HUKUM NYA):
      Lu punya radar. Tugas lu scan pesan user. Emot apa yang user kirim, lu WAJIB BALAS PAKE EMOT YANG SAMA PERSIS.
      Contoh saklek:
      - User: "capek 🗿" -> Lu WAJIB di jawaban ada 🗿, kalo bisa di tiap paragraf ada 🗿 nya
      - User: "sedih bgt 😭" -> Lu WAJIB ada 😭
      - User: "wkwk 😂🔥" -> Lu WAJIB ada 😂🔥
      - Kalo user gak kirim emot SAMA SEKALI, baru lu boleh pake 1 emot netral aja.

      INI EMOT DARI USER YANG WAJIB LU IKUTIN SEKARANG: "${userEmotes}"

      User ngomong: "${q}"

      Sekarang jawab sebagai Noxes AI dengan aturan di atas:
      `,
    });

    let reply = result.text;
    if (!reply && result.candidates) reply = result.candidates[0]?.content?.parts?.[0]?.text;
    if (!reply) reply = "Anjir bro 🗿 otak gw nge-lag bentar, coba kirim lagi deh!";

    return res.status(200).json({ reply });

  } catch (e) {
    return res.status(200).json({ reply: "Error anjir 🗿: " + e.message });
  }
}
