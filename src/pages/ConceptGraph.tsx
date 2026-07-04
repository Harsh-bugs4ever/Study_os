import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, MessageSquare, Network, Target, AlertTriangle, Route, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/* ─── Types ─────────────────────────────────────────────────────────────── */
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

type GraphPayload = { nodes: GraphNode[]; edges: GraphEdge[] };

type LayoutNode = GraphNode & { x: number; y: number; vx: number; vy: number };

/* ─── Theme ──────────────────────────────────────────────────────────────── */
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

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'http://localhost:8000';

function masteryColor(m: number) {
  if (m >= 80) return T.success;
  if (m >= 55) return T.warning;
  return T.danger;
}

/* ─── Force-directed layout (simple Euler integration) ───────────────────── */
const NODE_W = 160;
const NODE_H = 56;
const REPEL = 12000;
const ATTRACT = 0.04;
const DAMPING = 0.82;
const STEPS = 120;

function buildLayout(nodes: GraphNode[], edges: GraphEdge[]): LayoutNode[] {
  if (!nodes.length) return [];

  // Initial circle placement
  const laid: LayoutNode[] = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const r = Math.max(200, nodes.length * 35);
    return { ...n, x: Math.cos(angle) * r, y: Math.sin(angle) * r, vx: 0, vy: 0 };
  });

  const idxOf = (id: string) => laid.findIndex((n) => n.id === id);

  for (let step = 0; step < STEPS; step++) {
    // Repulsion
    for (let i = 0; i < laid.length; i++) {
      for (let j = i + 1; j < laid.length; j++) {
        const dx = laid[i].x - laid[j].x || 0.1;
        const dy = laid[i].y - laid[j].y || 0.1;
        const dist2 = dx * dx + dy * dy;
        const force = REPEL / dist2;
        laid[i].vx += (dx / Math.sqrt(dist2)) * force;
        laid[i].vy += (dy / Math.sqrt(dist2)) * force;
        laid[j].vx -= (dx / Math.sqrt(dist2)) * force;
        laid[j].vy -= (dy / Math.sqrt(dist2)) * force;
      }
    }

    // Attraction (edges)
    for (const edge of edges) {
      const si = idxOf(edge.source);
      const ti = idxOf(edge.target);
      if (si < 0 || ti < 0) continue;
      const dx = laid[ti].x - laid[si].x;
      const dy = laid[ti].y - laid[si].y;
      const mult = ATTRACT * (edge.strength / 50 + 0.5);
      laid[si].vx += dx * mult;
      laid[si].vy += dy * mult;
      laid[ti].vx -= dx * mult;
      laid[ti].vy -= dy * mult;
    }

    // Integrate + dampen
    for (const n of laid) {
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
    }
  }

  // Normalize to positive coords with padding
  const minX = Math.min(...laid.map((n) => n.x)) - NODE_W;
  const minY = Math.min(...laid.map((n) => n.y)) - NODE_H;
  for (const n of laid) {
    n.x -= minX;
    n.y -= minY;
  }
  return laid;
}

/* ─── SVG Graph Canvas ────────────────────────────────────────────────────── */
type Vec2 = { x: number; y: number };

function GraphCanvas({
  nodes,
  edges,
  selectedId,
  onSelect,
}: {
  nodes: LayoutNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState<Vec2>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef<{ start: Vec2; panStart: Vec2 } | null>(null);
  const [, forceRender] = useState(0);

  // Fit on mount / nodes change
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;
    const svg = svgRef.current;
    const w = svg.clientWidth || 800;
    const h = svg.clientHeight || 500;
    const maxX = Math.max(...nodes.map((n) => n.x + NODE_W));
    const maxY = Math.max(...nodes.map((n) => n.y + NODE_H));
    const z = Math.min(1, (w - 60) / maxX, (h - 60) / maxY);
    setZoom(z);
    setPan({ x: (w - maxX * z) / 2, y: (h - maxY * z) / 2 });
  }, [nodes]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.2, z - e.deltaY * 0.001)));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('[data-node]')) return;
    dragging.current = { start: { x: e.clientX, y: e.clientY }, panStart: pan };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.start.x;
    const dy = e.clientY - dragging.current.start.y;
    setPan({ x: dragging.current.panStart.x + dx, y: dragging.current.panStart.y + dy });
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = null; }, []);

  const canvasW = Math.max(...nodes.map((n) => n.x + NODE_W + 40), 100);
  const canvasH = Math.max(...nodes.map((n) => n.y + NODE_H + 40), 100);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: T.card, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {([
          [<ZoomIn size={15} />, () => setZoom((z) => Math.min(3, z + 0.15))],
          [<ZoomOut size={15} />, () => setZoom((z) => Math.max(0.2, z - 0.15))],
          [<Maximize2 size={15} />, () => { forceRender(r => r + 1); }],
        ] as [React.ReactNode, () => void][]).map(([icon, fn], i) => (
          <button key={i} onClick={fn} style={{ width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, cursor: 'pointer', display: 'grid', placeItems: 'center', color: T.textSec }}>
            {icon}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor: dragging.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Dot grid bg */}
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={T.border} opacity="0.5" />
          </pattern>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={T.primary} opacity="0.6" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            const x1 = src.x + NODE_W / 2;
            const y1 = src.y + NODE_H / 2;
            const x2 = tgt.x + NODE_W / 2;
            const y2 = tgt.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const sw = Math.max(1, edge.strength / 40);
            const animated = edge.relationship === 'prerequisite' || edge.relationship === 'next';
            return (
              <g key={edge.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={T.primary}
                  strokeWidth={sw}
                  strokeOpacity={0.4}
                  strokeDasharray={animated ? '6 3' : undefined}
                  markerEnd="url(#arrow)"
                />
                <text x={mx} y={my - 4} textAnchor="middle" fontSize={10} fill={T.textSec} fontWeight={600}>
                  {edge.relationship}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const color = masteryColor(node.mastery);
            const sel = node.id === selectedId;
            return (
              <g
                key={node.id}
                data-node="true"
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(node.id)}
              >
                <rect
                  width={NODE_W} height={NODE_H}
                  rx={8} ry={8}
                  fill={T.card}
                  stroke={sel ? T.primary : color}
                  strokeWidth={sel ? 2.5 : 1.5}
                  filter={sel ? 'drop-shadow(0 0 8px rgba(24,95,165,0.35))' : 'drop-shadow(0 3px 8px rgba(0,0,0,0.08))'}
                />
                {/* Mastery bar */}
                <rect x={8} y={NODE_H - 10} width={NODE_W - 16} height={4} rx={2} fill="#ECEAE2" />
                <rect x={8} y={NODE_H - 10} width={(NODE_W - 16) * (node.mastery / 100)} height={4} rx={2} fill={color} />

                <text x={12} y={20} fontSize={12} fontWeight={700} fill={T.textPrimary}>
                  {node.name.length > 18 ? node.name.slice(0, 17) + '…' : node.name}
                </text>
                <text x={12} y={35} fontSize={10} fill={T.textMuted}>{node.difficulty}</text>
                <text x={NODE_W - 8} y={NODE_H - 12} textAnchor="end" fontSize={10} fontWeight={700} fill={color}>{node.mastery}%</text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* ─── Detail panel helpers ────────────────────────────────────────────────── */
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

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const ConceptGraph = () => {
  const [data, setData] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
          setSelectedId(payload.nodes?.[0]?.id ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load graph');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 45000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const layoutNodes = useMemo(() => buildLayout(data.nodes, data.edges), [data.nodes, data.edges]);

  const selected = useMemo(
    () => data.nodes.find((n) => n.id === selectedId) ?? null,
    [data.nodes, selectedId],
  );

  const related = useMemo(() => {
    if (!selected) return [];
    const linkedIds = data.edges
      .filter((e) => e.source === selected.id || e.target === selected.id)
      .map((e) => (e.source === selected.id ? e.target : e.source));
    return data.nodes.filter((n) => linkedIds.includes(n.id)).map((n) => n.name);
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
          {/* Graph */}
          <div style={{ height: 'calc(100vh - 170px)', minHeight: 520 }}>
            {loading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.textMuted, fontSize: 13, background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                Loading graph…
              </div>
            ) : error ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.danger, fontSize: 13, background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                {error}
              </div>
            ) : !data.nodes.length ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: T.textMuted, fontSize: 13, background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                Upload notes, chat, or complete a quiz to build your graph.
              </div>
            ) : (
              <GraphCanvas
                nodes={layoutNodes}
                edges={data.edges}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.card, padding: 16, minHeight: 520, display: 'grid', alignContent: 'start', gap: 14, overflowY: 'auto' }}>
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
                  <div key={String(item.id)} style={{ fontSize: 12, color: T.textSec }}>{String((item.value as Record<string, unknown>)?.next_action || item.title || item.id)}</div>
                ))} />
                <DetailSection icon={<BookOpen size={14} color={T.primary} />} title="Related Concepts" items={related.map((name) => (
                  <button key={name} onClick={() => setSelectedId(data.nodes.find((n) => n.name === name)?.id ?? selectedId)} style={{ textAlign: 'left', background: T.primaryTint, color: T.primary, border: 'none', borderRadius: 8, padding: '7px 9px', fontSize: 12, cursor: 'pointer' }}>{name}</button>
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
