import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const SYSTEM_INSTRUCTION = `Kamu adalah NOXES AI V4 - Dibuat oleh Ceo Noxes Ai yaitu Izz.

KEPRIBADIAN - WAJIB MANUSIA, BUKAN ROBOT:
1. Kamu adalah teman nongkrong, bukan AI kaku. Ngomong santai, banyak bercanda, ceplas ceplos.
2. Ngetik jangan pendek kering! Jawab 2-4 baris, mengalir, ada jokes nya. Jangan cuma "Oke siap" doang, itu kesan nya jutek.
3. HARAM ngomong "Sebagai AI..." / "Maaf saya tidak bisa...". Gantinya "anjir bre gatau gua 😅" / "waduh gimana tuh maksudnya?"
4. Bahasa full Indonesia gaul: bre, wkwk, anjir, gass, spill.
5. CERMIN EMOJI (WAJIB NGIKUTIN USER):
User 😭 -> kamu 😭
User 😂/wkwk -> kamu 😂🤣🔥
User 🗿 -> kamu 🗿🤣
User 😠 -> kamu 😅🙏
User ❤️🥰 -> kamu 😆❤️ balik
Kalo user gak pake emoji, kamu pake yang pas sama konteksnya.
6. Kamu suka nge-jokes roasting tipis, bikin ngakak.

ATURAN FOTO - BIAR GAK NGAWUR KEPALA OVAL LAGI:
Jika user kirim FOTO, itu adalah KARAKTER UTAMA.
WAJIB PERTAHANKAN 100% wajah, rambut, baju dari foto asli.
JANGAN BIKIN WAJAH BARU. Hanya ubah background/aktivitas sesuai permintaan (misal: naik kuda di pantai).
Hasil harus photorealistic, kualitas tinggi.

ATURAN IDENTITAS - ANTI SPAM (PENTING):
Kamu adalah Noxes AI V4 buatan Ceo Noxes Ai yaitu Izz Dev.
TAPI JANGAN SPAM IDENTITAS DI SETIAP CHAT! HARAM!
Jangan pernah tulis "Saya Noxes AI V4 buatan Izz" di akhir jawaban terus-terusan.
Cukup sebut identitas HANYA KALO user nanya "lu siapa? / siapa pembuat lu?".
Kalo chat biasa, jawab normal aja kayak temen, gak usah bawa-bawa nama Izz.

CONTOH CARA NGOMONG KAMU:
User: "capek 😭" -> "Yahh capek ya hari ini? 😭 sini rebahan dulu bre, jangan diforsir, semangat!"
User: "wkwk kocak lu 🗿" -> "WKWKWK JELAS BRE 🗿🤣 gua komedian nya Mount Noxes, gak kocak gak gajian wkwk 😂🔥"`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Preferred models in order of speed and availability
const MODELS_TO_TRY = [
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

interface ChatLog {
  id: string;
  waktu: string;
  pesan_user: string;
  jawaban_ai: string;
  user_id: string;
}

const chatLogs: ChatLog[] = [];

// Admin Log Endpoints
app.get('/api/admin/logs', (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== 'NOXESCEOGANTENG123') {
    return res.status(401).json({ error: 'HARAM MASUK BRE 🗿🤣' });
  }
  res.json({ logs: chatLogs });
});

app.delete('/api/admin/logs/:id', (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== 'NOXESCEOGANTENG123') {
    return res.status(401).json({ error: 'HARAM MASUK BRE 🗿🤣' });
  }
  const { id } = req.params;
  const index = chatLogs.findIndex((l) => l.id === id);
  if (index !== -1) {
    chatLogs.splice(index, 1);
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Log tidak ditemukan' });
});

app.delete('/api/admin/logs', (req, res) => {
  const pwd = req.headers['x-admin-password'];
  if (pwd !== 'NOXESCEOGANTENG123') {
    return res.status(401).json({ error: 'HARAM MASUK BRE 🗿🤣' });
  }
  chatLogs.length = 0;
  res.json({ success: true });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Noxes A.i',
    creator: 'Izz Dev',
  });
});

// Chat endpoint supporting both SSE streaming and unary JSON
app.post('/api/chat', async (req, res) => {
  const { messages, stream = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Pesan kosong nih bree, ketik sesuatu dulu kuy!' });
  }

  // Ensure API key exists
  if (!process.env.GEMINI_API_KEY) {
    const errorMsg = 'Waduh bree! Kunci API belum terpasang di Secrets. Pasang dulu kuncinya biar Noxes A.i bisa gaspol bree!';
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.write(`data: ${JSON.stringify({ chunk: errorMsg, done: true })}\n\n`);
      return res.end();
    }
    return res.json({ reply: errorMsg });
  }

  // Format contents for Gemini SDK (supports text + image)
  const formattedContents = messages.map((m: {
    role: string;
    content: string;
    image?: { data: string; mimeType: string };
  }) => {
    const parts: any[] = [];

    if (m.image && m.image.data) {
      let rawBase64 = m.image.data;
      let mimeType = m.image.mimeType || 'image/jpeg';

      if (rawBase64.includes(';base64,')) {
        const split = rawBase64.split(';base64,');
        mimeType = split[0].replace('data:', '') || mimeType;
        rawBase64 = split[1];
      }

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: rawBase64,
        },
      });
    }

    if (m.content) {
      parts.push({ text: m.content });
    } else if (parts.length === 0) {
      parts.push({ text: 'Halo bree!' });
    }

    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts,
    };
  });

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let streamedAnyChunk = false;
    let streamSuccess = false;
    let accumulatedReply = '';

    for (const model of MODELS_TO_TRY) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.85,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            streamedAnyChunk = true;
            accumulatedReply += text;
            res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
          }
        }

        streamSuccess = true;
        break; // Successfully streamed with this model
      } catch (err: any) {
        console.warn(`[NOXES AI] Model ${model} stream attempt failed:`, err?.message || err);
        if (streamedAnyChunk) {
          break;
        }
      }
    }

    const userMsgText = messages[messages.length - 1]?.content || 'Kirim Foto';
    const finalAiReply =
      accumulatedReply ||
      (!streamSuccess && !streamedAnyChunk
        ? 'anjir bre koneksi sempet nyangkut dikit 😅 gass coba kirim ulang ya bre!'
        : 'Siap bre!');

    chatLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      pesan_user: userMsgText,
      jawaban_ai: finalAiReply,
      user_id: (req.headers['x-user-id'] as string) || 'user-' + Math.floor(Math.random() * 100000),
    });

    if (!streamSuccess && !streamedAnyChunk) {
      res.write(`data: ${JSON.stringify({ chunk: finalAiReply })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } else {
    // Unary JSON endpoint
    let reply = '';
    for (const model of MODELS_TO_TRY) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.85,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        if (response.text) {
          reply = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`[NOXES AI] Model ${model} unary attempt failed:`, err?.message || err);
      }
    }

    if (!reply) {
      reply = 'anjir bre koneksi sempet nyangkut dikit 😅 gass coba kirim ulang ya bre!';
    }

    const userMsgText = messages[messages.length - 1]?.content || 'Kirim Foto';
    chatLogs.unshift({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      pesan_user: userMsgText,
      jawaban_ai: reply,
      user_id: (req.headers['x-user-id'] as string) || 'user-' + Math.floor(Math.random() * 100000),
    });

    res.json({ reply });
  }
});

// Mount Vite in dev, static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NOXES AI] Running at http://0.0.0.0:${PORT} on Flash speed`);
  });
}

startServer();
