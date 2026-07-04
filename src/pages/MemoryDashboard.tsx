import { useEffect, useMemo, useState } from 'react';
import { Archive, BookOpen, Clock, FileText, MessageSquare, Pin, Search, Target, Trash2, Route, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type MemoryItem = {
  id: string;
  kind: string;
  key: string;
  value: Record<string, unknown>;
  tags?: string[];
  pinned: boolean;
  updated_at: string;
  created_at: string;
};

type MemoryData = {
  pinned: MemoryItem[];
  recent: MemoryItem[];
  conversations: MemoryItem[];
  quiz_memories: MemoryItem[];
  planner_history: MemoryItem[];
  documents: Array<Record<string, unknown>>;
  quiz_attempts: Array<Record<string, unknown>>;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000';

const T = {
  bg: '#F1EFE8',
  card: '#FFFFFF',
  text: '#2C2C2A',
  muted: '#888780',
  sec: '#5F5E5A',
  border: '#D3D1C7',
  primary: '#185FA5',
  tint: '#E6F1FB',
  danger: '#B94747',
};

function label(memory: MemoryItem) {
  const value = memory.value || {};
  return String(value.topic || value.title || value.subject || value.excerpt || value.next_action || memory.key);
}

function MemoryRow({ item, onPin, onDelete, onTag }: { item: MemoryItem; onPin: (item: MemoryItem) => void; onDelete: (item: MemoryItem) => void; onTag: (item: MemoryItem) => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, border: `1px solid ${T.border}`, borderRadius: 8, background: item.pinned ? T.tint : T.card }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: T.primary, fontWeight: 700, textTransform: 'uppercase' }}>{item.kind}</span>
          <span style={{ fontSize: 10, color: T.muted }}>{new Date(item.updated_at).toLocaleDateString()}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.35 }}>{label(item).slice(0, 180)}</p>
        {(item.tags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {(item.tags || []).slice(0, 5).map(tag => <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: T.tint, color: T.primary }}>{tag}</span>)}
          </div>
        )}
      </div>
      <button onClick={() => onTag(item)} title="Tag" style={{ border: 0, background: 'transparent', color: T.muted, cursor: 'pointer' }}><Tag size={14} /></button>
      <button onClick={() => onPin(item)} title={item.pinned ? 'Unpin' : 'Pin'} style={{ border: 0, background: 'transparent', color: item.pinned ? T.primary : T.muted, cursor: 'pointer' }}><Pin size={14} /></button>
      <button onClick={() => onDelete(item)} title="Delete" style={{ border: 0, background: 'transparent', color: T.danger, cursor: 'pointer' }}><Trash2 size={14} /></button>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', fontSize: 14, color: T.text }}>
        {icon}{title}
      </h2>
      {children}
    </section>
  );
}

const MemoryDashboard = () => {
  const [data, setData] = useState<MemoryData | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    const headers = await authHeaders();
    const response = await fetch(`${BACKEND_URL}/api/memory`, { headers });
    if (response.ok) setData(await response.json());
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const run = async () => {
      if (!query.trim()) { setResults([]); return; }
      const headers = await authHeaders();
      const response = await fetch(`${BACKEND_URL}/api/memory/search`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (response.ok) setResults((await response.json()).results || []);
    };
    const timer = window.setTimeout(run, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const updatePin = async (item: MemoryItem) => {
    const headers = await authHeaders();
    await fetch(`${BACKEND_URL}/api/memory/pin`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, pinned: !item.pinned }),
    });
    await load();
  };

  const deleteItem = async (item: MemoryItem) => {
    const headers = await authHeaders();
    await fetch(`${BACKEND_URL}/api/memory/delete`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    });
    await load();
  };

  const tagItem = async (item: MemoryItem) => {
    const current = (item.tags || []).join(', ');
    const raw = window.prompt('Tags for this memory', current);
    if (raw === null) return;
    const headers = await authHeaders();
    await fetch(`${BACKEND_URL}/api/memory/tag`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, tags: raw.split(',').map(tag => tag.trim()).filter(Boolean) }),
    });
    await load();
  };

  const visibleRecent = useMemo(() => query.trim() ? results : data?.recent || [], [data, query, results]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 14 }}>
        <header>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 22, color: T.text }}>
            <Archive size={20} color={T.primary} /> Memory Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Search, pin, browse, and clean up Saathi memory.</p>
        </header>

        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: T.muted }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, outline: 'none', fontSize: 13 }} />
        </div>

        {loading ? <p style={{ color: T.muted, fontSize: 13 }}>Loading memory...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 14 }} className="memory-grid">
            <div style={{ display: 'grid', gap: 14 }}>
              <Section icon={<Pin size={15} color={T.primary} />} title="Pinned Memories">
                <div style={{ display: 'grid', gap: 8 }}>{(data?.pinned || []).map(item => <MemoryRow key={item.id} item={item} onPin={updatePin} onDelete={deleteItem} onTag={tagItem} />)}</div>
                {data?.pinned.length === 0 && <p style={{ margin: 0, fontSize: 12, color: T.muted }}>No pinned memories yet.</p>}
              </Section>
              <Section icon={<Clock size={15} color={T.primary} />} title={query.trim() ? 'Search Results' : 'Recent Memories'}>
                <div style={{ display: 'grid', gap: 8 }}>{visibleRecent.map(item => <MemoryRow key={item.id} item={item} onPin={updatePin} onDelete={deleteItem} onTag={tagItem} />)}</div>
                {visibleRecent.length === 0 && <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Nothing found yet.</p>}
              </Section>
              <Section icon={<MessageSquare size={15} color={T.primary} />} title="Previous Conversations">
                <div style={{ display: 'grid', gap: 8 }}>{(data?.conversations || []).slice(0, 8).map(item => <MemoryRow key={item.id} item={item} onPin={updatePin} onDelete={deleteItem} onTag={tagItem} />)}</div>
              </Section>
            </div>
            <aside style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <Section icon={<FileText size={15} color={T.primary} />} title="Uploaded Documents">
                <div style={{ display: 'grid', gap: 8 }}>{(data?.documents || []).slice(0, 8).map((doc) => <p key={String(doc.id)} style={{ margin: 0, fontSize: 12, color: T.sec }}>{String(doc.title || doc.storage_key)}</p>)}</div>
              </Section>
              <Section icon={<Target size={15} color={T.primary} />} title="Quiz Memories">
                <div style={{ display: 'grid', gap: 8 }}>{(data?.quiz_attempts || []).slice(0, 8).map((quiz) => <p key={String(quiz.id)} style={{ margin: 0, fontSize: 12, color: T.sec }}>{String(quiz.topic)} · {String(quiz.score)}%</p>)}</div>
              </Section>
              <Section icon={<Route size={15} color={T.primary} />} title="Planner History">
                <div style={{ display: 'grid', gap: 8 }}>{(data?.planner_history || []).slice(0, 8).map(item => <MemoryRow key={item.id} item={item} onPin={updatePin} onDelete={deleteItem} onTag={tagItem} />)}</div>
              </Section>
              <Section icon={<BookOpen size={15} color={T.primary} />} title="Memory Types">
                <p style={{ margin: 0, fontSize: 12, color: T.sec }}>{data?.recent.length || 0} memories · {data?.documents.length || 0} documents · {data?.quiz_attempts.length || 0} quizzes</p>
              </Section>
            </aside>
          </div>
        )}
      </div>
      <style>{`@media(max-width:900px){.memory-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};

export default MemoryDashboard;
