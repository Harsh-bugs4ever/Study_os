import { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Edge, Node, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { BookOpen, FileText, MessageSquare, Network, Target, AlertTriangle, Route } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type GraphNode = {
  id: string;
  name: string;
  difficulty: string;
  mastery: number;
  metadata: Record<string, unknown>;
  connectedDocuments: Record<string, unknown>[];
  connectedMemories: Record<string, unknown>[];
  relatedQuizHistory: Record<string, unknown>[];
  previousChats: Record<string, unknown>[];
  studyPlannerRecommendations: Record<string, unknown>[];
  weaknesses: string[];
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relationship: string;
  strength: number;
};

type GraphPayload = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

const T = {
  bg: '#F1EFE8',
  card: '#FFFFFF',
  textPrimary: '#2C2C2A',
  textSec: '#5F5E5A',
  textMuted: '#888780',
  border: '#D3D1C7',
  primary: '#185FA5',
  primaryTint: '#E6F1FB',
  warning: '#BA7517',
  danger: '#B94747',
  success: '#2F7D52',
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000';

function masteryColor(mastery: number) {
  if (mastery >= 80) return T.success;
  if (mastery >= 55) return T.warning;
  return T.danger;
}

function layout(nodes: GraphNode[]): Node[] {
  const columns = Math.max(2, Math.ceil(Math.sqrt(nodes.length || 1)));
  return nodes.map((node, index) => ({
    id: node.id,
    position: { x: (index % columns) * 230, y: Math.floor(index / columns) * 140 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: { label: node.name, mastery: node.mastery },
    style: {
      width: 176,
      borderRadius: 8,
      border: `1px solid ${masteryColor(node.mastery)}`,
      background: T.card,
      color: T.textPrimary,
      boxShadow: '0 6px 18px rgba(44,44,42,.08)',
      fontSize: 12,
      padding: 0,
    },
  }));
}

function nodeLabel(node: Node) {
  const data = node.data as { label: string; mastery: number };
  const color = masteryColor(data.mastery);
  return (
    <div style={{ display: 'grid', gap: 6, padding: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, color: T.textPrimary }}>{data.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#ECEAE2', overflow: 'hidden' }}>
          <div style={{ width: `${data.mastery}%`, height: '100%', background: color }} />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color }}>{data.mastery}%</span>
      </div>
    </div>
  );
}

function DetailSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: React.ReactNode[] }) {
  return (
    <section style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px' }}>
        {icon}{title}
      </h3>
      {items.length ? (
        <div style={{ display: 'grid', gap: 7 }}>{items}</div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>No linked records yet.</p>
      )}
    </section>
  );
}

const ConceptGraph = () => {
  const [data, setData] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      try {
        const response = await fetch(`${BACKEND_URL}/api/graph`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`Graph API returned ${response.status}`);
        const payload = await response.json();
        if (active) {
          setData(payload);
          setSelected(payload.nodes?.[0] ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load graph');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 45000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const flowNodes = useMemo(
    () => layout(data.nodes).map((node) => ({ ...node, data: { ...node.data, label: nodeLabel(node) } })),
    [data.nodes],
  );

  const flowEdges: Edge[] = useMemo(() => data.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relationship,
    animated: edge.relationship === 'prerequisite' || edge.relationship === 'next',
    style: { stroke: T.primary, strokeWidth: Math.max(1, edge.strength / 40) },
    labelStyle: { fill: T.textSec, fontSize: 10, fontWeight: 600 },
  })), [data.edges]);

  const related = useMemo(() => {
    if (!selected) return [];
    const linkedIds = data.edges
      .filter((edge) => edge.source === selected.id || edge.target === selected.id)
      .map((edge) => edge.source === selected.id ? edge.target : edge.source);
    return data.nodes.filter((node) => linkedIds.includes(node.id)).map((node) => node.name);
  }, [data.edges, data.nodes, selected]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '24px 16px 72px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 14 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 22, fontWeight: 800, color: T.textPrimary }}>
              <Network size={20} color={T.primary} /> Concept Graph
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted }}>
              {data.nodes.length} concepts · {data.edges.length} relationships
            </p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 14 }} className="concept-graph-grid">
          <div style={{ height: 'calc(100vh - 170px)', minHeight: 520, border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.textMuted, fontSize: 13 }}>Loading graph...</div>
            ) : error ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.danger, fontSize: 13 }}>{error}</div>
            ) : data.nodes.length ? (
              <ReactFlow nodes={flowNodes} edges={flowEdges} fitView onNodeClick={(_, node) => setSelected(data.nodes.find((item) => item.id === node.id) ?? null)}>
                <Background color="#D3D1C7" gap={18} />
                <Controls />
              </ReactFlow>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.textMuted, fontSize: 13 }}>Upload notes, chat, or complete a quiz to build your graph.</div>
            )}
          </div>

          <aside style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, padding: 16, minHeight: 520, display: 'grid', alignContent: 'start', gap: 14 }}>
            {selected ? (
              <>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em' }}>{selected.difficulty}</p>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.textPrimary }}>{selected.name}</h2>
                  <div style={{ marginTop: 10, height: 7, borderRadius: 99, background: '#ECEAE2', overflow: 'hidden' }}>
                    <div style={{ width: `${selected.mastery}%`, height: '100%', background: masteryColor(selected.mastery) }} />
                  </div>
                </div>
                <DetailSection icon={<FileText size={14} color={T.primary} />} title="Uploaded Notes & PDFs" items={selected.connectedDocuments.map((item) => (
                  <div key={String(item.id)} style={{ fontSize: 12, color: T.textSec }}>{String(item.title || item.storage_key || item.id)}</div>
                ))} />
                <DetailSection icon={<Target size={14} color={T.primary} />} title="Quiz Attempts" items={selected.relatedQuizHistory.map((item) => (
                  <div key={String(item.id)} style={{ fontSize: 12, color: T.textSec }}>{String(item.topic || selected.name)} · {String(item.score ?? 0)}%</div>
                ))} />
                <DetailSection icon={<AlertTriangle size={14} color={T.warning} />} title="Weakness" items={selected.weaknesses.map((item) => (
                  <div key={item} style={{ fontSize: 12, color: T.textSec }}>{item}</div>
                ))} />
                <DetailSection icon={<MessageSquare size={14} color={T.primary} />} title="Previous Chats" items={selected.previousChats.map((item) => (
                  <div key={String(item.id)} style={{ fontSize: 12, color: T.textSec }}>{String(item.excerpt || item.timestamp || item.id).slice(0, 140)}</div>
                ))} />
                <DetailSection icon={<Route size={14} color={T.primary} />} title="Study Planner Recommendations" items={selected.studyPlannerRecommendations.map((item) => (
                  <div key={String(item.id)} style={{ fontSize: 12, color: T.textSec }}>{String((item.value as any)?.next_action || item.title || item.id)}</div>
                ))} />
                <DetailSection icon={<BookOpen size={14} color={T.primary} />} title="Related Concepts" items={related.map((item) => (
                  <button key={item} onClick={() => setSelected(data.nodes.find((node) => node.name === item) ?? selected)} style={{ textAlign: 'left', background: T.primaryTint, color: T.primary, border: 'none', borderRadius: 8, padding: '7px 9px', fontSize: 12, cursor: 'pointer' }}>{item}</button>
                ))} />
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>Select a concept to inspect its learning history.</p>
            )}
          </aside>
        </div>
      </div>
      <style>{`
        .react-flow__attribution { display: none; }
        @media (max-width: 900px) {
          .concept-graph-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ConceptGraph;
