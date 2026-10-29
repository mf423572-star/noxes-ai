import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Zap, Shield, HelpCircle, Flame, Terminal, Lightbulb, Camera, Wand2 } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatMessage } from './components/ChatMessage';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { Message, ChatSession } from './types';
import { detectSceneFromPrompt, composeFaceIntoScene } from './utils/faceCompositor';
import AdminPage from './pages/AdminPage';

const STORAGE_KEY_SESSIONS = 'noxes_ai_sessions_v1';
const STORAGE_KEY_ACTIVE = 'noxes_ai_active_session_id';

const STARTER_PROMPTS = [
  '📸 Edit foto muka gua lagi nongkrong di cafe estetik',
  '🚀 Edit foto muka gua jadi astronot di luar angkasa',
  '🌅 Bikin gua lagi santuy di pantai sunset',
  'Pantun gaul dong bree!',
  'Ide side hustle modal dengkul tapi cuan',
  'Codingan JavaScript gue error mulu nih bree, tolong!',
];

export default function App() {
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [chatLogs, setChatLogs] = useState<{ id: number; waktu: string; playerId: string; playerName: string; user: string; ai: string }[]>([]);
  const [searchLog, setSearchLog] = useState("");
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [adminSearchUser, setAdminSearchUser] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    let pId = localStorage.getItem('noxes_player_id');
    if (!pId) {
      pId = `USER_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      localStorage.setItem('noxes_player_id', pId);
    }
    let pName = localStorage.getItem('noxes_player_name');
    if (!pName) {
      pName = pId;
      localStorage.setItem('noxes_player_name', pName);
    }
    setPlayerId(pId);
    setPlayerName(pName);

    const savedLogs = localStorage.getItem('noxes_chat_logs_v1');
    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) setChatLogs(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('noxes_chat_logs_v1', JSON.stringify(chatLogs));
  }, [chatLogs]);

  useEffect(() => {
    if (clickCount === 0) return;
    if (clickCount >= 5) {
      setShowAdmin(true);
      setClickCount(0);
      return;
    }
    const timer = setTimeout(() => {
      setClickCount(0);
    }, 3000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE);

      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          if (savedActiveId && parsed.some((s) => s.id === savedActiveId)) {
            setActiveSessionId(savedActiveId);
            return;
          }
          setActiveSessionId(parsed[0].id);
          return;
        }
      }

      // Initialize default session
      const newSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Obrolan Baru',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } catch (e) {
      console.error('Failed to load sessions from storage:', e);
      const fallback: ChatSession = {
        id: 'session-' + Date.now(),
        title: 'Obrolan Baru',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
    if (activeSessionId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeSessionId);
    }
  }, [sessions, activeSessionId]);

  // Current active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading]);

  // Create new chat session
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Obrolan Baru',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
  };

  // Delete specific session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fallback: ChatSession = {
          id: 'session-' + Date.now(),
          title: 'Obrolan Baru',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (id === activeSessionId) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Clear current chat
  const handleClearChat = () => {
    if (!activeSession) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [], updatedAt: Date.now(), title: 'Obrolan Baru' }
          : s
      )
    );
    setShowClearConfirm(false);
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'Obrolan Baru',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Send message to backend (supports text and image)
  const handleSendMessage = async (
    textToSend: string,
    image?: { data: string; mimeType: string }
  ) => {
    const userPrompt = textToSend.trim();
    if ((!userPrompt && !image) || isLoading || !activeSession) return;

    setInput('');

    const userMessage: Message = {
      id: 'msg-u-' + Date.now(),
      role: 'user',
      content: userPrompt || 'Edit foto muka gua Bos',
      timestamp: Date.now(),
      image: image,
    };

    // Update session title if first message
    const updatedTitle =
      activeSession.messages.length === 0
        ? (image ? '📸 ' : '') + (userPrompt.slice(0, 26) || 'Edit Foto Wajah')
        : activeSession.title;

    const currentHistory = [...activeSession.messages, userMessage];

    // Optimistically update state
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              messages: currentHistory,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);
    setStreamingMessage('');

    // If image was attached, generate face composite scene
    let generatedImageData: { url: string; title: string } | undefined = undefined;
    if (image?.data) {
      try {
        const sceneType = detectSceneFromPrompt(userPrompt);
        const comp = await composeFaceIntoScene(image.data, sceneType, userPrompt);
        generatedImageData = {
          url: comp.dataUrl,
          title: comp.title,
        };
      } catch (compErr) {
        console.error('Error generating face composite:', compErr);
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedReply = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentHistory.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi otak NOXES AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Streaming stream reader gagal diakses');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonPart = trimmed.replace(/^data:\s*/, '').trim();
            if (!jsonPart) continue;

            try {
              const data = JSON.parse(jsonPart);
              if (data.chunk) {
                accumulatedReply += data.chunk;
                setStreamingMessage(accumulatedReply);
              }
            } catch (err) {
              console.error('Error parsing SSE JSON:', err);
            }
          }
        }
      }

      // If buffer has leftover
      if (buffer.trim().startsWith('data:')) {
        try {
          const jsonPart = buffer.trim().replace(/^data:\s*/, '').trim();
          const data = JSON.parse(jsonPart);
          if (data.chunk) {
            accumulatedReply += data.chunk;
            setStreamingMessage(accumulatedReply);
          }
        } catch {}
      }

      // If user uploaded an image for editing, ensure prompt includes required phrase:
      let finalReply = accumulatedReply.trim();
      if (image && generatedImageData) {
        const requiredPhrase = `Siap bree! Muka lu tetep ori 100%, background nya udah gua gantiin jadi ${generatedImageData.title.toLowerCase()} bree!`;
        if (!finalReply) {
          finalReply = `${requiredPhrase} Nih hasilnya mantap djiwa kan bree!`;
        } else if (!finalReply.toLowerCase().includes('muka lu tetep ori')) {
          finalReply = `${requiredPhrase}\n\n${finalReply}`;
        }
      } else if (!finalReply) {
        finalReply = 'Siap bree! Ada yang mau ditanyain lagi gak bree? Gaspol bree!';
      }

      const aiMessage: Message = {
        id: 'msg-ai-' + Date.now(),
        role: 'model',
        content: finalReply,
        timestamp: Date.now(),
        generatedImage: generatedImageData,
      };

      setChatLogs(prev => [
        ...prev,
        {
          id: Date.now(),
          waktu: new Date().toLocaleString('id-ID'),
          user: userPrompt,
          ai: finalReply,
        },
      ]);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, aiMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (accumulatedReply.trim() || generatedImageData) {
          const aiMessage: Message = {
            id: 'msg-ai-' + Date.now(),
            role: 'model',
            content: accumulatedReply.trim() || 'Siap bree!',
            timestamp: Date.now(),
            generatedImage: generatedImageData,
          };
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, messages: [...s.messages, aiMessage] }
                : s
            )
          );
        }
      } else {
        console.error('Chat error:', err);
        const fallbackReply = image && generatedImageData
          ? `Siap bree! Muka lu tetep ori 100%, background nya udah gua gantiin jadi ${generatedImageData.title.toLowerCase()} bree! Nih fotonya mantul bree!`
          : 'Santuy bree, otak Noxes A.i sempat kesandung bentar nih. Pertanyaannya boleh dicoba kirim ulang lagi ya bree!';

        const aiMessage: Message = {
          id: 'msg-ai-' + Date.now(),
          role: 'model',
          content: fallbackReply,
          timestamp: Date.now(),
          generatedImage: generatedImageData,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: [...s.messages, aiMessage] }
              : s
          )
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage('');
      abortControllerRef.current = null;
    }
  };

  // Regenerate last AI response
  const handleRegenerate = () => {
    if (isLoading || !activeSession || activeSession.messages.length === 0) return;

    // Find the last user message
    const msgs = activeSession.messages;
    const lastUserMsgIndex = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserMsgIndex === -1) return;

    const actualIndex = msgs.length - 1 - lastUserMsgIndex;
    const userPrompt = msgs[actualIndex].content;

    // Slice history up to that user message, removing subsequent AI messages
    const trimmedHistory = msgs.slice(0, actualIndex);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: trimmedHistory }
          : s
      )
    );

    // Resend the prompt
    setTimeout(() => {
      handleSendMessage(userPrompt);
    }, 50);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08080d] text-slate-100 antialiased font-sans">
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
      />

      {/* Main Chat Area */}
      <div className="relative flex flex-1 flex-col h-full min-w-0 bg-[#08080d]">
        {/* Header */}
        <Header
          onClearChat={() => setShowClearConfirm(true)}
          onNewChat={handleNewSession}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          hasMessages={messages.length > 0}
          activeSessionTitle={activeSession?.title}
          onLogoClick={() => setClickCount((c) => c + 1)}
        />

        {/* Admin Panel Full Screen Overlay */}
        {showAdmin && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] text-slate-100 overflow-y-auto p-4 sm:p-8 animate-fade-in font-sans">
            <div className="max-w-5xl w-full mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222238] pb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                    NOXES ADMIN PANEL - By Izz Dev
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Hacker Dashboard & Realtime Memory Logs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdmin(false);
                    setIsAdminLoggedIn(false);
                    setAdminPassword('');
                  }}
                  className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50 transition-all shadow-lg"
                >
                  Tutup Panel
                </button>
              </div>

              {!isAdminLoggedIn ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-full max-w-md rounded-2xl border border-[#222238] bg-[#12121a] p-8 shadow-2xl text-center space-y-4">
                    <h2 className="text-lg font-bold text-white font-mono">🔐 ADMIN LOGIN REQUIRED</h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (adminPassword === 'NOXESCEOGANTENG123') {
                          setIsAdminLoggedIn(true);
                          setAdminPassword('');
                        }
                      }}
                      className="space-y-4"
                    >
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Masukkan Password Admin..."
                        className="w-full rounded-xl border border-[#2a2a3f] bg-[#1a1a28] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono text-center"
                        autoFocus
                      />
                      {adminPassword && adminPassword !== 'NOXESCEOGANTENG123' && (
                        <div className="text-lg font-black text-rose-500 animate-shake">
                          HARAM MASUK BRE 🗿🤣
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all"
                      >
                        LOGIN
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Controls Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#222238] bg-[#12121a] p-4 shadow-xl">
                    <div className="relative w-full sm:w-96">
                      <input
                        type="text"
                        value={searchLog}
                        onChange={(e) => setSearchLog(e.target.value)}
                        placeholder="Cari pesan user atau jawaban AI..."
                        className="w-full rounded-xl border border-[#2a2a3f] bg-[#1a1a28] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs font-mono text-indigo-400">
                        Total Chat: {chatLogs.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChatLogs([])}
                        className="rounded-xl border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40 transition-colors"
                      >
                        Hapus Semua Log
                      </button>
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="rounded-2xl border border-[#222238] bg-[#12121a] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#222238] bg-[#161622] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                            <th className="p-4">Waktu</th>
                            <th className="p-4">Pesan User</th>
                            <th className="p-4">Jawaban AI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e2c] text-xs sm:text-sm">
                          {chatLogs.filter(
                            (l) =>
                              l.user.toLowerCase().includes(searchLog.toLowerCase()) ||
                              l.ai.toLowerCase().includes(searchLog.toLowerCase())
                          ).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-slate-500 italic font-mono">
                                {chatLogs.length === 0 ? 'Belum ada log chat terekam.' : 'Tidak ditemukan log yang cocok.'}
                              </td>
                            </tr>
                          ) : (
                            chatLogs
                              .filter(
                                (l) =>
                                  l.user.toLowerCase().includes(searchLog.toLowerCase()) ||
                                  l.ai.toLowerCase().includes(searchLog.toLowerCase())
                              )
                              .map((log) => (
                                <tr key={log.id} className="hover:bg-[#161622]/60 transition-colors">
                                  <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                    {log.waktu}
                                  </td>
                                  <td className="p-4 max-w-xs sm:max-w-md text-slate-200">
                                    {log.user}
                                  </td>
                                  <td className="p-4 max-w-xs sm:max-w-md text-slate-300">
                                    {log.ai}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
          {/* Subtle Cyber Grid Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#7c4dff]/5 via-transparent to-transparent" />

          {messages.length === 0 ? (
            /* Empty State Hero */
            <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center sm:py-16">
              {/* Glowing N Logo Hero */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#00ffc6]/20 to-[#7c4dff]/25 blur-xl animate-pulse-glow" />
                <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00ffc6] to-[#7c4dff] p-[2.5px] shadow-2xl shadow-[#00ffc6]/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-[#0c0c14]">
                    <span className="font-extrabold text-4xl sm:text-5xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00ffc6] to-[#7c4dff]">
                      N
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                Halo bree! Gua{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffc6] to-[#7c4dff]">
                  Noxes A.i
                </span>
              </h2>
              <p className="max-w-lg text-sm sm:text-base text-slate-400 mb-6 font-normal">
                Dirilis resmi oleh <span className="text-[#00ffc6] font-semibold">CEO Noxes Ai v4, yaitu Izz Dev bree</span>. 
                Ahli segala bidang, siap nemenin koding, bikin hook TikTok FYP, edit foto, sampe curhat santuy!
              </p>

              {/* Feature Highlights Pills */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-[#00ffc6]/40 bg-[#00ffc6]/10 px-3 py-1 text-xs text-[#00ffc6] font-semibold shadow-sm shadow-[#00ffc6]/10">
                  <Camera className="h-3.5 w-3.5" />
                  <span>V5: Edit Foto Wajah (Muka 100% Ori)</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[#222234] bg-[#12121a] px-3 py-1 text-xs text-slate-300">
                  <Zap className="h-3.5 w-3.5 text-[#00ffc6]" />
                  <span>Respon Cepat & Santuy</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[#222234] bg-[#12121a] px-3 py-1 text-xs text-slate-300">
                  <Shield className="h-3.5 w-3.5 text-[#00ffc6]" />
                  <span>Karya Asli Izz dev</span>
                </div>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2 text-left">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="group flex items-start gap-3 rounded-2xl border border-[#1f1f2e] bg-[#12121a] p-3.5 transition-all hover:border-[#00ffc6]/40 hover:bg-[#161624] hover:shadow-lg hover:shadow-cyan-950/20 text-left"
                  >
                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a1a2b] text-[#00ffc6] group-hover:bg-[#00ffc6]/20 transition-colors">
                      {idx % 3 === 0 ? (
                        <Flame className="h-3.5 w-3.5" />
                      ) : idx % 3 === 1 ? (
                        <Lightbulb className="h-3.5 w-3.5 text-[#7c4dff]" />
                      ) : (
                        <Terminal className="h-3.5 w-3.5 text-[#00ffc6]" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white leading-snug">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Feed */
            <div className="mx-auto max-w-4xl py-4 sm:py-6 space-y-1">
              {messages.map((msg, index) => {
                const isLastAI =
                  msg.role === 'model' &&
                  index === messages.length - 1;

                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isLastAI={isLastAI}
                    onRegenerate={handleRegenerate}
                    isLoading={isLoading}
                  />
                );
              })}

              {/* Streaming AI Message as it streams in */}
              {streamingMessage && (
                <ChatMessage
                  message={{
                    id: 'streaming-ai-active',
                    role: 'model',
                    content: streamingMessage,
                    timestamp: Date.now(),
                  }}
                  isLastAI={true}
                  isLoading={true}
                />
              )}

              {/* Typing Indicator: "NOXES lagi ngetik..." (shows while waiting for first chunk) */}
              {isLoading && !streamingMessage && <TypingIndicator />}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          suggestedPrompts={STARTER_PROMPTS.slice(0, 3)}
          showSuggestions={messages.length === 0}
          playerId={playerId}
          playerName={playerName}
          onUpdatePlayerName={(newName) => {
            localStorage.setItem('noxes_player_name', newName);
            setPlayerName(newName);
          }}
        />

        {/* Footer */}
        <Footer />
      </div>

      {/* Confirmation Modal for Clear Chat */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-[#2b2233] bg-[#12121a] p-5 shadow-2xl shadow-rose-950/30">
            <h3 className="text-base font-bold text-white mb-2">
              Hapus Percakapan Ini bree?
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Semua obrolan di sesi ini bakal dihapus permanen. Tapi tenang, lu selalu bisa mulai obrolan baru kapan aja bree!
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-[#26263a] bg-[#181826] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#202030] hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 transition-colors"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
