import { useEffect, useState } from 'react';
import { Activity, Archive, Brain, FileText, GitBranch, Network, Search, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000';

const T = {
  bg: '#F1EFE8',
  card: '#FFFFFF',
  text: '#2C2C2A',
  muted: '#888780',
  border: '#D3D1C7',
  primary: '#185FA5',
  tint: '#E6F1FB',
  success: '#2F7D52',
};

type DemoMetrics = {
  number_of_memories: number;
  knowledge_graph_size: { concepts: number; relationships: number };
  concepts_learned: number;
  relationships_built: number;
  documents_indexed: number;
  quiz_attempts: number;
  study_plans_generated: number;
  cognee_searches: number;
  memory_updates: number;
};

type Mentor = {
  todays_focus: string;
  weakest_topic: string;
  most_improved_topic: { topic: string; delta: number } | null;
  suggested_revision: { title: string; reason: string; action: string } | null;
  suggested_quiz: { topic: string; difficulty: string };
  suggested_document: { title: string } | null;
  insights: string[];
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: T.primary }}>{icon}</div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 800, color: T.text }}>{value}</span>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted }}>{label}</p>
    </div>
  );
}

const CogneeDemo = () => {
  const [metrics, setMetrics] = useState<DemoMetrics | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [cards, setCards] = useState<Array<{ topic: string; front: string; back: string }>>([]);
  const [query, setQuery] = useState('Operating Systems scheduling');
  const [searchResults, setSearchResults] = useState<Array<{ text: string }>>([]);

  const headers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const load = async () => {
    const auth = await headers();
    const [demoRes, mentorRes, timelineRes, cardsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/cognee/demo`, { headers: auth }),
      fetch(`${BACKEND_URL}/api/cognee/mentor`, { headers: auth }),
      fetch(`${BACKEND_URL}/api/cognee/timeline`, { headers: auth }),
      fetch(`${BACKEND_URL}/api/cognee/revision-cards`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
    ]);
    if (demoRes.ok) setMetrics(await demoRes.json());
    if (mentorRes.ok) setMentor(await mentorRes.json());
    if (timelineRes.ok) setTimeline(await timelineRes.json());
    if (cardsRes.ok) setCards((await cardsRes.json()).cards || []);
  };

  useEffect(() => { void load(); }, []);

  const runSearch = async () => {
    const auth = await headers();
    const res = await fetch(`${BACKEND_URL}/api/cognee/search`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, mode: 'CHUNKS' }),
    });
    if (res.ok) setSearchResults((await res.json()).results || []);
  };

  const graph = metrics?.knowledge_graph_size || { concepts: 0, relationships: 0 };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gap: 14 }}>
        <header>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 22, color: T.text }}>
            <Zap size={20} color={T.primary} /> Cognee Demo Mode
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>Live proof that memory, graph, retrieval, and planning are Cognee-powered.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <Stat icon={<Archive size={18} />} label="Number of Memories" value={metrics?.number_of_memories ?? 0} />
          <Stat icon={<Network size={18} />} label="Knowledge Graph Size" value={`${graph.concepts}/${graph.relationships}`} />
          <Stat icon={<Brain size={18} />} label="Concepts Learned" value={metrics?.concepts_learned ?? 0} />
          <Stat icon={<GitBranch size={18} />} label="Relationships Built" value={metrics?.relationships_built ?? 0} />
          <Stat icon={<FileText size={18} />} label="Documents Indexed" value={metrics?.documents_indexed ?? 0} />
          <Stat icon={<Target size={18} />} label="Quiz Attempts" value={metrics?.quiz_attempts ?? 0} />
          <Stat icon={<Activity size={18} />} label="Study Plans Generated" value={metrics?.study_plans_generated ?? 0} />
          <Stat icon={<Search size={18} />} label="Cognee Searches" value={metrics?.cognee_searches ?? 0} />
        </div>

        {mentor && (
          <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: T.text }}>AI Mentor</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Today's Focus:</strong> {mentor.todays_focus}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Weakest Topic:</strong> {mentor.weakest_topic}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Most Improved:</strong> {mentor.most_improved_topic ? `${mentor.most_improved_topic.topic} +${mentor.most_improved_topic.delta}%` : 'Not enough attempts yet'}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Suggested Quiz:</strong> {mentor.suggested_quiz.topic}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Suggested Document:</strong> {mentor.suggested_document?.title || 'Upload a PDF to activate this'}</p>
              <p style={{ margin: 0, fontSize: 13, color: T.text }}><strong>Suggested Revision:</strong> {mentor.suggested_revision?.title || mentor.todays_focus}</p>
            </div>
          </section>
        )}

        <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, color: T.text }}>Cross-document Semantic Search</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 10px', fontSize: 13 }} />
            <button onClick={runSearch} style={{ border: 0, borderRadius: 8, background: T.primary, color: 'white', padding: '0 14px', fontSize: 13, fontWeight: 700 }}>Search</button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{searchResults.slice(0, 4).map((item, index) => (
            <p key={index} style={{ margin: 0, fontSize: 12, color: T.muted, background: T.tint, borderRadius: 8, padding: 10 }}>{item.text}</p>
          ))}</div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 14 }} className="demo-grid">
          <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: T.text }}>Knowledge Evolution Timeline</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {(timeline?.knowledge_evolution?.timeline || []).slice(-8).map((item: any) => (
                <div key={item.date} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.muted }}>{item.date}</span>
                  <div style={{ height: 8, borderRadius: 99, background: T.tint, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, item.concepts * 8)}%`, background: T.success }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, color: T.text }}>Automatic Revision Cards</h2>
            <div style={{ display: 'grid', gap: 8 }}>{cards.slice(0, 4).map((card) => (
              <div key={card.topic} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: T.text }}>{card.front}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{card.back.slice(0, 170)}</p>
              </div>
            ))}</div>
          </section>
        </div>
      </div>
      <style>{`@media(max-width:900px){.demo-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
};

export default CogneeDemo;
