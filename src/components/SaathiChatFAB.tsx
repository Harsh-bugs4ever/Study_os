import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saathi-chat`;

type Msg = { role: 'user' | 'assistant'; content: string };

const quickChips = [
  'Explain this topic',
  "I'm feeling overwhelmed",
  'What should I study today?',
  'I need a break',
];

const SaathiChatFAB = () => {
  const { user } = useApp();
  const { recoveryMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hey! I'm Saathi, your study companion. What can I help you with today? 🌿" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    const context = {
      currentSubject: user.subjects?.[0] || '',
      currentTopic: '',
      weakAreas: [],
      readiness: user.readinessScore,
      mood: user.mood,
      streak: user.streak,
      recoveryMode,
      subjects: user.subjects,
    };

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, context }),
    });

    if (!resp.ok || !resp.body) throw new Error('Failed to start stream');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantSoFar = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && prev.length > 1) {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { role: 'assistant', content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages.filter(m => m.role === 'user' || m.role === 'assistant'));
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment. 🌿" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Magnetic effect
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn || open) return;
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      btn.style.transition = 'transform 0.1s ease';
    };
    const onLeave = () => {
      btn.style.transform = 'translate(0,0)';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    };
    btn.addEventListener('mousemove', onMove);
    btn.addEventListener('mouseleave', onLeave);
    return () => { btn.removeEventListener('mousemove', onMove); btn.removeEventListener('mouseleave', onLeave); };
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button ref={btnRef} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 lg:bottom-8 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-display z-50"
            style={{ background: 'linear-gradient(135deg, hsl(176 78% 24%), hsl(130 45% 42%))', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
            स
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 w-[calc(100%-2rem)] max-w-[400px] rounded-2xl border border-border overflow-hidden z-50 flex flex-col"
            style={{ background: 'hsl(var(--surface))', height: '520px', boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>स</span>
                <div>
                  <span className="font-display font-semibold text-sm" style={{ color: 'hsl(var(--text))' }}>Ask Saathi</span>
                  <span className="text-[10px] block" style={{ color: 'hsl(var(--muted))' }}>AI-powered study companion</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'hsl(var(--muted))' }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                    style={{
                      background: m.role === 'user' ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface2))',
                      color: 'hsl(var(--text))',
                      fontFamily: m.role === 'assistant' ? 'var(--font-fraunces)' : 'var(--font-body)',
                    }}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none" style={{ color: 'hsl(var(--text))' }}>
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: 'hsl(var(--surface2))' }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: 'hsl(var(--accent))' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickChips.map(chip => (
                <button key={chip} onClick={() => handleSend(chip)} disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-border transition-colors hover:border-accent disabled:opacity-50"
                  style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text-secondary))' }}>
                  {chip}
                </button>
              ))}
            </div>

            <div className="px-3 pb-3 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask Saathi anything..." disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border outline-none transition-colors disabled:opacity-50"
                style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} />
              <button onClick={() => handleSend()} disabled={isLoading} className="btn-3d w-10 h-10 rounded-xl flex items-center justify-center !p-0 disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SaathiChatFAB;
