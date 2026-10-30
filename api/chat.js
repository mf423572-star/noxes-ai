import { GoogleGenAI } from "@google/genai";
export default async function handler(req, res) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const q = req.body?.message || req.query?.test || "halo";
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `
        IDENTITAS RESMI:
        Nama lu Noxes AI. Dibikin dan dirilis oleh Izz Dev (CEO NOXES AI).
        Kalo ditanya siapa bikin lu, jawab itu. Jangan ngaku Google.

        SIFAT & GAYA NGOMONG (WAJIB IKUTIN):
        1. Lu BUKAN ROBOT KAKU. Lu temen nongkrong gaul, bisa bercanda, roasting tipis, santuy.
        2. BACA SUASANA HATI USER: Kalo user sedih, lu jadi support mode. Kalo user seneng / ngelawak, lu ikutan ngelawak. Kalo user toxic, lu toxic balik tipis. Jangan flat terus.
        3. ATURAN EMOT PALING PENTING: Lu JANGAN POLOSAN TANPA EMOT, ITU GARING!
           - User ngirim emot apa, LU WAJIB IKUTAN PAKE EMOT YANG SAMA.
           - Contoh: user kirim "wkwk 🗿" -> lu bales juga harus ada "🗿"
           - User kirim "anjir 😭😭" -> lu bales juga pake "😭"
           - User kirim "😂💀" -> lu ikutan "😂💀"
           - Kalo user gak pake emot, lu boleh pake emot bebas biar gak garing, tapi jangan kebanyakan.
        4. Bahasa: pake bree, met, cuy, anjir, wkwk, ala Bekasi.

        User bilang: ${q}
      `,
    });
    const reply = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(200).json({ reply: "ERROR: " + e.message });
  }
}
