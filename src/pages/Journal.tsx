import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, Sparkles, ChevronDown, ChevronUp, Trash2, Smile, Heart, Frown, AlertCircle, Cloud, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const moodOptions = [
  { icon: <Smile size={16} />, label: 'Happy' },
  { icon: <Heart size={16} />, label: 'Calm' },
  { icon: <Frown size={16} />, label: 'Sad' },
  { icon: <AlertCircle size={16} />, label: 'Frustrated' },
  { icon: <Cloud size={16} />, label: 'Anxious' },
  { icon: <HelpCircle size={16} />, label: 'Reflective' },
];

const journalPrompts = [
  "What's one thing you're grateful for today?",
  "What challenged you today, and how did you handle it?",
  "If you could tell your future self one thing, what would it be?",
  "What made you smile today?",
  "What's something you learned recently that surprised you?",
  "Write about a moment today when you felt proud of yourself.",
  "What's been on your mind a lot lately?",
  "If stress were a color, what color would yours be today and why?",
  "What would your ideal study day look like?",
  "Write a letter to yourself on a hard day.",
  "What's one boundary you want to set this week?",
  "Describe your current mood using a weather metaphor.",
];

interface JournalEntry {
  id: string;
  content: string;
  mood: string | null;
  prompt_used: string | null;
  created_at: string;
}

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (!session) {
        setIsAuthenticated(false);
        setEntries([]);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      await loadEntries(session.user.id);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session) {
        setIsAuthenticated(false);
        setEntries([]);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      void loadEntries(session.user.id);
    });

    void bootstrap();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadEntries = async (userId?: string) => {
    setLoading(true);

    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user.id;
    }

    if (!currentUserId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Could not load journal entries');
    } else {
      setEntries((data as JournalEntry[]) || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Write something first!'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error('Please log in to save entries'); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: session.user.id,
        content: content.trim(),
        mood: selectedMood,
        prompt_used: currentPrompt,
      })
      .select('*')
      .single();
    if (error) {
      toast.error(error.message || 'Failed to save');
    } else {
      setEntries(prev => [data as JournalEntry, ...prev]);
      toast.success('Entry saved successfully');
      setContent('');
      setSelectedMood(null);
      setCurrentPrompt(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Entry deleted');
    }
  };

  const getRandomPrompt = () => {
    const prompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setCurrentPrompt(prompt);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
          <BookOpen size={24} style={{ color: 'hsl(var(--accent))' }} /> Journal
        </h2>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>Your private space to reflect, process, and grow.</p>
      </motion.div>

      {/* New Entry */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base space-y-4">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>New Entry</h3>

        {!isAuthenticated && (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}>
            Please sign in first to save private journal entries.
          </div>
        )}

        {/* Mood selector */}
        <div>
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted))' }}>How are you feeling?</p>
          <div className="flex gap-2 flex-wrap">
            {moodOptions.map(m => (
              <button key={m.label} onClick={() => setSelectedMood(selectedMood === m.label ? null : m.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{
                  background: selectedMood === m.label ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface2))',
                  borderColor: selectedMood === m.label ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                  color: selectedMood === m.label ? 'hsl(var(--accent))' : 'hsl(var(--text))',
                }}>
                <span className="text-base">{m.icon}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        {currentPrompt && (
          <div className="p-3 rounded-xl" style={{ background: 'hsl(var(--accent-soft))' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--accent))' }}>💡 Prompt</p>
            <p className="text-sm italic" style={{ color: 'hsl(var(--text))' }}>{currentPrompt}</p>
          </div>
        )}

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-border text-sm resize-none outline-none transition-all focus:ring-2"
          style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} />

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving || !content.trim() || !isAuthenticated}
            className="btn-3d text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Entry'}
          </button>
          <button onClick={getRandomPrompt}
            className="btn-3d-ghost text-sm px-4 py-2.5 flex items-center gap-2">
            <Sparkles size={14} /> Prompt me
          </button>
        </div>
      </motion.div>

      {/* Past Entries */}
      <div>
        <h3 className="font-display text-sm font-semibold mb-3" style={{ color: 'hsl(var(--text))' }}>Past Entries</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 card-base">
            <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'hsl(var(--muted))' }} />
            <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>No entries yet. Start writing!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              const preview = entry.content.length > 120 ? entry.content.slice(0, 120) + '...' : entry.content;
              const moodObj = moodOptions.find(m => m.label === entry.mood);
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="card-base">
                  <button onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="w-full text-left">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{formatDate(entry.created_at)}</span>
                        {moodObj && <span className="text-sm" title={moodObj.label} style={{ color: 'hsl(var(--accent))' }}>{moodObj.icon}</span>}
                      </div>
                      {isExpanded ? <ChevronUp size={14} style={{ color: 'hsl(var(--muted))' }} /> : <ChevronDown size={14} style={{ color: 'hsl(var(--muted))' }} />}
                    </div>
                    <p className="text-sm" style={{ color: 'hsl(var(--text))' }}>{isExpanded ? entry.content : preview}</p>
                  </button>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid hsl(var(--border))' }}>
                      {entry.prompt_used && (
                        <p className="text-[10px] italic" style={{ color: 'hsl(var(--muted))' }}>Prompt: {entry.prompt_used}</p>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:bg-danger/10"
                        style={{ color: 'hsl(var(--danger))' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
