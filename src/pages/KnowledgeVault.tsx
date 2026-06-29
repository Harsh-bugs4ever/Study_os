/**
 * KnowledgeVault.tsx — Immersive 3D Knowledge Library
 * Enhancement layer: Three.js 3D scene + glassmorphism + tilt + cursor light
 * All original Supabase logic is UNTOUCHED.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, FileText, Video, ClipboardList,
  ChevronRight, Home, Download, Play, Filter, Loader2,
  Globe, Upload, X, ExternalLink, Plus, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

/* Types (unchanged) */
type Level = 'subjects' | 'topics' | 'sub_topics' | 'materials';
interface Stream   { id: string; name: string; icon: string; description: string; }
interface Subject  { id: string; name: string; stream_id: string; icon: string; description: string; }
interface Topic    { id: string; name: string; subject_id: string; description: string; }
interface SubTopic { id: string; name: string; topic_id: string; description: string; }
interface Material { id: string; title: string; type: string; url: string; sub_topic_id: string; year: number | null; file_size: string | null; duration: string | null; created_at: string | null; }

const typeIcons:  Record<string, any>             = { pdf: FileText, video: Video, pyq: ClipboardList };
const typeLabels: Record<string, string>          = { pdf: 'PDF Notes', video: 'Video Lectures', pyq: 'PYQs' };
const typeEmoji:  Record<string, React.ReactNode> = {
  pdf:   <FileText size={14} />,
  video: <Video size={14} />,
  pyq:   <ClipboardList size={14} />,
};

/* ═══════════════════════════════════════════════════════════════
   3D SCENE HOOK — Three.js loaded via CDN, isolated in canvas
═══════════════════════════════════════════════════════════════ */
function useVaultScene(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scriptId = 'three-js-cdn-vault';
    let cleanup: (() => void) | undefined;

    const init = () => {
      const THREE = (window as any).THREE;
      if (!THREE || !canvas) return;

      const W = canvas.clientWidth  || window.innerWidth;
      const H = canvas.clientHeight || window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x000000, 0);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
      camera.position.set(0, 0, 18);

      /* ── Centerpiece: Floating Ancient Book ── */
      const bookGroup = new THREE.Group();

      const coverMat = new THREE.MeshPhongMaterial({ color: 0xC6A028, emissive: 0x7A5C00, emissiveIntensity: 0.4, shininess: 80 });
      const cover    = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.8, 0.38), coverMat);
      bookGroup.add(cover);

      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 4.8, 0.44),
        new THREE.MeshPhongMaterial({ color: 0xA07820, shininess: 60 })
      );
      spine.position.x = -1.95;
      bookGroup.add(spine);

      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(3.3, 4.5, 0.28),
        new THREE.MeshPhongMaterial({ color: 0xF5E8C0, shininess: 10 })
      );
      pages.position.z = -0.33;
      bookGroup.add(pages);

      // Glowing OM ring on cover
      const omRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.07, 10, 32),
        new THREE.MeshPhongMaterial({ color: 0xFFD700, emissive: 0xFFAA00, emissiveIntensity: 1.0 })
      );
      omRing.position.set(0.3, 0.3, 0.22);
      bookGroup.add(omRing);

      const omDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xFFEE88, emissive: 0xFFCC44, emissiveIntensity: 1.3 })
      );
      omDot.position.set(0.3, 0.88, 0.22);
      bookGroup.add(omDot);

      bookGroup.position.set(5.5, 0.5, -4);
      bookGroup.rotation.y = -0.55;
      scene.add(bookGroup);

      /* ── Floating Particles ── */
      const COUNT = 200;
      const positions  = new Float32Array(COUNT * 3);
      const colors     = new Float32Array(COUNT * 3);
      const velocities = new Float32Array(COUNT * 3);
      const palette    = [
        new THREE.Color(0xC6A028), new THREE.Color(0xFFE580),
        new THREE.Color(0xFF9933), new THREE.Color(0xE8D4A0), new THREE.Color(0xD4AF37),
      ];
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 40;
        positions[i3 + 1] = (Math.random() - 0.5) * 28;
        positions[i3 + 2] = (Math.random() - 0.5) * 18 - 5;
        velocities[i3]     = (Math.random() - 0.5) * 0.008;
        velocities[i3 + 1] = Math.random() * 0.005 + 0.002;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.13, vertexColors: true, transparent: true, opacity: 0.72,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      /* ── Glowing Orbs / Fireflies ── */
      const orbsGroup = new THREE.Group();
      type OrbEntry = { mesh: THREE.Mesh; spd: THREE.Vector3; phase: number };
      const orbData: OrbEntry[] = [];
      const orbColors = [0xFFAA22, 0xFFCC44, 0xFF7700, 0xFFE090, 0xD4AF37];
      for (let o = 0; o < 13; o++) {
        const r   = Math.random() * 0.22 + 0.09;
        const mat = new THREE.MeshPhongMaterial({
          color: orbColors[o % 5], emissive: orbColors[o % 5], emissiveIntensity: 1.8,
          transparent: true, opacity: 0.65,
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), mat);
        mesh.position.set((Math.random() - 0.5) * 28, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10 - 4);
        orbsGroup.add(mesh);
        orbData.push({
          mesh,
          spd: new THREE.Vector3((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.003),
          phase: Math.random() * Math.PI * 2,
        });
      }
      scene.add(orbsGroup);

      /* ── Mandala / Yantra rings ── */
      const mandala = new THREE.Group();
      [3.2, 5.0, 6.8, 8.5].forEach((rad, idx) => {
        const segs = idx % 2 === 0 ? 6 : 8;
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(rad, 0.018, 4, segs),
          new THREE.MeshBasicMaterial({ color: 0xC6A028, transparent: true, opacity: 0.065 - idx * 0.01 })
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(-3, -1, -9);
        mandala.add(mesh);
      });
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI;
        const pts = [
          new THREE.Vector3(Math.cos(ang) * -9, Math.sin(ang) * -9, -9),
          new THREE.Vector3(Math.cos(ang) *  9, Math.sin(ang) *  9, -9),
        ];
        mandala.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xC6A028, transparent: true, opacity: 0.035 })
        ));
      }
      scene.add(mandala);

      /* ── Lights ── */
      scene.add(new THREE.AmbientLight(0xFFF8E7, 0.85));
      const keyLight = new THREE.PointLight(0xFFCC44, 2.5, 40);
      keyLight.position.set(4, 6, 8);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0xFF9933, 1.2, 30);
      rimLight.position.set(-8, -3, 5);
      scene.add(rimLight);

      /* ── Resize handler ── */
      const onResize = () => {
        const w = canvas.clientWidth; const h = canvas.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      window.addEventListener('resize', onResize);

      /* ── Animation loop ── */
      let frame = 0;
      let animId: number;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        frame++;
        const t  = frame * 0.01;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;

        bookGroup.position.y   = 0.5 + Math.sin(t * 0.7) * 0.22;
        bookGroup.rotation.y   = -0.55 + Math.sin(t * 0.4) * 0.08 + mx * 0.04;
        bookGroup.rotation.x   = Math.sin(t * 0.5) * 0.04 - my * 0.02;

        mandala.children.forEach((child, i) => { (child as THREE.Mesh).rotation.z = t * (i % 2 === 0 ? 0.12 : -0.08); });

        const posArr = (pGeo.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          posArr[i3]     += velocities[i3]     + mx * 0.0018;
          posArr[i3 + 1] += velocities[i3 + 1] - my * 0.001;
          posArr[i3 + 2] += velocities[i3 + 2];
          if (posArr[i3 + 1] > 16)  posArr[i3 + 1] = -16;
          if (posArr[i3]     > 22)   posArr[i3]     = -22;
          if (posArr[i3]     < -22)  posArr[i3]     =  22;
        }
        pGeo.attributes.position.needsUpdate = true;

        orbData.forEach(({ mesh, spd, phase }) => {
          mesh.position.x += spd.x + Math.sin(t + phase) * 0.003;
          mesh.position.y += spd.y + Math.cos(t * 0.7 + phase) * 0.004;
          mesh.position.z += spd.z;
          if (Math.abs(mesh.position.x) > 16) spd.x *= -1;
          if (Math.abs(mesh.position.y) > 12) spd.y *= -1;
          if (Math.abs(mesh.position.z) > 8)  spd.z *= -1;
          (mesh.material as THREE.MeshPhongMaterial).opacity = 0.45 + 0.3 * Math.sin(t * 1.2 + phase);
        });

        camera.position.x += (mx * 0.8 - camera.position.x) * 0.02;
        camera.position.y += (-my * 0.5 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        keyLight.intensity = 2.2 + Math.sin(t * 1.5) * 0.4;

        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if ((window as any).THREE) {
      init();
    } else if (!existing) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = init;
      document.head.appendChild(s);
    } else {
      existing.addEventListener('load', init);
    }

    return () => { cleanup?.(); };
  }, [canvasRef]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width  - 0.5) * 2,
      y: ((e.clientY - rect.top)  / rect.height - 0.5) * 2,
    };
  }, []);

  return { onMouseMove };
}

/* ═══════════════════════════════════════════════════════════
   TILT CARD HOOK — edge-based 3D tilt + shadow depth
═══════════════════════════════════════════════════════════ */
function useTiltCard() {
  const ref = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) scale3d(1.03,1.03,1.03)`;
    el.style.boxShadow = `${-x * 18}px ${-y * 12}px 40px rgba(198,160,40,0.18),0 12px 40px rgba(0,0,0,0.18),0 0 0 1px rgba(198,160,40,0.12) inset`;
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

/* ═══════════════════════════════════════════════════════════
   CURSOR LIGHT HOOK
═══════════════════════════════════════════════════════════ */
function useCursorLight() {
  const lightRef   = useRef<HTMLDivElement | null>(null);
  const frameRef   = useRef<number>(0);
  const targetRef  = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const light = lightRef.current; if (!light) return;
    const loop = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.1;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.1;
      light.style.left = `${currentRef.current.x}px`;
      light.style.top  = `${currentRef.current.y}px`;
      frameRef.current  = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    targetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  return { lightRef, onMouseMove };
}

/* ═══════════════════════════════════════════════════════════
   TILT CARD WRAPPER
═══════════════════════════════════════════════════════════ */
const TiltCard = ({
  children, onClick, className = '', style = {},
}: {
  children: React.ReactNode; onClick?: () => void;
  className?: string; style?: React.CSSProperties;
}) => {
  const { ref, onMouseMove, onMouseLeave } = useTiltCard();
  const baseClass = `vault-glass-card relative overflow-hidden ${className}`;
  const baseStyle: React.CSSProperties = { transition: 'transform 0.12s ease, box-shadow 0.12s ease', ...style };
  if (onClick) {
    return (
      <button ref={ref as React.RefObject<HTMLButtonElement>}
        onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
        className={baseClass} style={baseStyle}>
        <div className="vault-sheen" aria-hidden />
        {children}
      </button>
    );
  }
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className={baseClass} style={baseStyle}>
      <div className="vault-sheen" aria-hidden />
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const KnowledgeVault = () => {
  const { user } = useApp();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const { onMouseMove: on3DMove } = useVaultScene(canvasRef);
  const { lightRef, onMouseMove: onLightMove } = useCursorLight();

  /* ── All original state (unchanged) ── */
  const [level, setLevel]                       = useState<Level>('subjects');
  const [streams, setStreams]                   = useState<Stream[]>([]);
  const [subjects, setSubjects]                 = useState<Subject[]>([]);
  const [topics, setTopics]                     = useState<Topic[]>([]);
  const [subTopics, setSubTopics]               = useState<SubTopic[]>([]);
  const [materials, setMaterials]               = useState<Material[]>([]);
  const [allMaterials, setAllMaterials]         = useState<Material[]>([]);
  const [selectedSubject, setSelectedSubject]   = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic]       = useState<Topic | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopic | null>(null);
  const [activeTab, setActiveTab]               = useState<'pdf' | 'video' | 'pyq'>('pdf');
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState<Material[]>([]);
  const [searching, setSearching]               = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [showExplore, setShowExplore]           = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [yearFilter, setYearFilter]             = useState<number | null>(null);
  const [materialCounts, setMaterialCounts]     = useState<Record<string, { pdf: number; video: number; pyq: number }>>({});
  const [recentMaterials, setRecentMaterials]   = useState<(Material & { subjectName?: string })[]>([]);
  const [error, setError]                       = useState<string | null>(null);
  const [showUpload, setShowUpload]             = useState(false);
  const [uploading, setUploading]               = useState(false);
  const [uploadTitle, setUploadTitle]           = useState('');
  const [uploadType, setUploadType]             = useState<'pdf' | 'video' | 'pyq'>('pdf');
  const [uploadUrl, setUploadUrl]               = useState('');
  const [uploadFile, setUploadFile]             = useState<File | null>(null);
  const fileInputRef                            = useRef<HTMLInputElement>(null);
  const [uploadStreamId, setUploadStreamId]     = useState<string | null>(null);
  const [uploadSubjectId, setUploadSubjectId]   = useState<string | null>(null);
  const [uploadTopicId, setUploadTopicId]       = useState<string | null>(null);
  const [uploadSubTopicId, setUploadSubTopicId] = useState<string | null>(null);
  const [uploadSubjects, setUploadSubjects]     = useState<Subject[]>([]);
  const [uploadTopics, setUploadTopics]         = useState<Topic[]>([]);
  const [uploadSubTopics, setUploadSubTopics]   = useState<SubTopic[]>([]);
  const [newTopicName, setNewTopicName]         = useState('');
  const [newSubTopicName, setNewSubTopicName]   = useState('');
  const [creatingTopic, setCreatingTopic]       = useState(false);
  const [creatingSubTopic, setCreatingSubTopic] = useState(false);
  const [newSubjectName, setNewSubjectName]     = useState('');
  const [creatingSubject, setCreatingSubject]   = useState(false);
  const [allTopics, setAllTopics]               = useState<Topic[]>([]);
  const [allSubTopics, setAllSubTopics]         = useState<SubTopic[]>([]);
  const [sceneReady, setSceneReady]             = useState(false);

  useEffect(() => { const t = setTimeout(() => setSceneReady(true), 300); return () => clearTimeout(t); }, []);

  const userStreamName = useMemo(() => {
    const map: Record<string, string> = {
      jee: 'Science PCM', neet: 'Science PCB', boards: 'Science PCM',
      engineering: 'Engineering', commerce: 'Commerce', arts: 'Arts', other: 'Science PCM',
    };
    return map[user.examType] || 'Science PCM';
  }, [user.examType]);

  /* ── Load (unchanged) ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      const [{ data: st, error: e1 }, { data: subs, error: e2 }, { data: allMats, error: e3 }, { data: allT }, { data: allST }] =
        await Promise.all([
          supabase.from('streams').select('*').order('name'),
          supabase.from('subjects').select('*').order('name'),
          supabase.from('materials').select('*').order('created_at', { ascending: false }),
          supabase.from('topics').select('*').order('name'),
          supabase.from('sub_topics').select('*').order('name'),
        ]);
      if (e1 || e2 || e3) setError('Could not load the knowledge vault right now. Please try again.');
      setStreams((st as Stream[]) || []); setSubjects((subs as Subject[]) || []);
      setAllMaterials((allMats as Material[]) || []); setAllTopics((allT as Topic[]) || []);
      setAllSubTopics((allST as SubTopic[]) || []);
      const userStream = (st as Stream[])?.find(s => s.name === userStreamName);
      if (userStream) setSelectedStreamId(userStream.id);
      setLoading(false);
    };
    load();
  }, [userStreamName]);

  useEffect(() => {
    if (!subjects.length || !allMaterials.length || !allTopics.length || !allSubTopics.length) return;
    const topicToSubject: Record<string, string> = {};
    allTopics.forEach(t => { topicToSubject[t.id] = t.subject_id; });
    const subTopicToSubject: Record<string, string> = {};
    allSubTopics.forEach(st => { subTopicToSubject[st.id] = topicToSubject[st.topic_id] || ''; });
    const counts: Record<string, { pdf: number; video: number; pyq: number }> = {};
    allMaterials.forEach(m => {
      const subjId = subTopicToSubject[m.sub_topic_id] || ''; if (!subjId) return;
      if (!counts[subjId]) counts[subjId] = { pdf: 0, video: 0, pyq: 0 };
      if (m.type === 'pdf') counts[subjId].pdf++;
      else if (m.type === 'video') counts[subjId].video++;
      else if (m.type === 'pyq') counts[subjId].pyq++;
    });
    setMaterialCounts(counts);
    const streamSubjectIds = subjects.filter(s => s.stream_id === selectedStreamId).map(s => s.id);
    const recent = allMaterials
      .filter(m => { const sid = subTopicToSubject[m.sub_topic_id]; return sid && streamSubjectIds.includes(sid); })
      .slice(0, 6)
      .map(m => { const sid = subTopicToSubject[m.sub_topic_id]; return { ...m, subjectName: subjects.find(s => s.id === sid)?.name || '' }; });
    setRecentMaterials(recent);
  }, [subjects, allMaterials, selectedStreamId, allTopics, allSubTopics]);

  const filteredSubjects = useMemo(() => {
    if (showExplore || !selectedStreamId) return subjects;
    return subjects.filter(s => s.stream_id === selectedStreamId);
  }, [subjects, selectedStreamId, showExplore]);

  const loadTopics    = async (subjectId: string) => { setLoading(true); setError(null); const { data, error } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('name'); if (error) setError('Could not load topics.'); setTopics((data as Topic[]) || []); setLoading(false); };
  const loadSubTopics = async (topicId: string)   => { setLoading(true); setError(null); const { data, error } = await supabase.from('sub_topics').select('*').eq('topic_id', topicId).order('name'); if (error) setError('Could not load sub-topics.'); setSubTopics((data as SubTopic[]) || []); setLoading(false); };
  const loadMaterials = async (subTopicId: string) => { setLoading(true); setError(null); const { data, error } = await supabase.from('materials').select('*').eq('sub_topic_id', subTopicId).order('created_at', { ascending: false }); if (error) setError('Could not load materials.'); setMaterials((data as Material[]) || []); setLoading(false); };

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase.from('materials').select('*').ilike('title', `%${q}%`).limit(20);
    if (error) setError('Search is unavailable right now.');
    setSearchResults((data as Material[]) || []); setSearching(false);
  }, []);

  useEffect(() => { const t = setTimeout(() => handleSearch(searchQuery), 300); return () => clearTimeout(t); }, [searchQuery, handleSearch]);

  const navigateTo = (newLevel: Level, item?: any) => {
    if (newLevel === 'subjects') { setLevel('subjects'); setSelectedSubject(null); setSelectedTopic(null); setSelectedSubTopic(null); }
    else if (newLevel === 'topics' && item)     { setSelectedSubject(item); setLevel('topics'); setSelectedTopic(null); setSelectedSubTopic(null); loadTopics(item.id); }
    else if (newLevel === 'sub_topics' && item) { setSelectedTopic(item); setLevel('sub_topics'); setSelectedSubTopic(null); loadSubTopics(item.id); }
    else if (newLevel === 'materials' && item)  { setSelectedSubTopic(item); setLevel('materials'); setActiveTab('pdf'); loadMaterials(item.id); }
  };

  const openMaterial = (m: Material) => {
    if (m.url) window.open(m.url, '_blank', 'noopener,noreferrer');
    else toast.error('No URL available for this material');
  };

  const handleUploadStreamChange = (streamId: string) => {
    setUploadStreamId(streamId); setUploadSubjectId(null); setUploadTopicId(null); setUploadSubTopicId(null);
    setUploadSubjects(subjects.filter(s => s.stream_id === streamId)); setUploadTopics([]); setUploadSubTopics([]);
  };
  const handleUploadSubjectChange = async (subjectId: string) => {
    setUploadSubjectId(subjectId); setUploadTopicId(null); setUploadSubTopicId(null); setUploadSubTopics([]);
    setUploadTopics(allTopics.filter(t => t.subject_id === subjectId));
  };
  const handleUploadTopicChange = (topicId: string) => {
    setUploadTopicId(topicId); setUploadSubTopicId(null);
    setUploadSubTopics(allSubTopics.filter(st => st.topic_id === topicId));
  };
  const openUploadModal = () => {
    if (selectedSubTopic && selectedTopic && selectedSubject) {
      setUploadStreamId(selectedSubject.stream_id); setUploadSubjects(subjects.filter(s => s.stream_id === selectedSubject.stream_id));
      setUploadSubjectId(selectedSubject.id); setUploadTopics(allTopics.filter(t => t.subject_id === selectedSubject.id));
      setUploadTopicId(selectedTopic.id); setUploadSubTopics(allSubTopics.filter(st => st.topic_id === selectedTopic.id));
      setUploadSubTopicId(selectedSubTopic.id);
    } else {
      if (selectedStreamId) { setUploadStreamId(selectedStreamId); setUploadSubjects(subjects.filter(s => s.stream_id === selectedStreamId)); }
      else { setUploadStreamId(null); setUploadSubjects([]); }
      setUploadSubjectId(null); setUploadTopicId(null); setUploadSubTopicId(null); setUploadTopics([]); setUploadSubTopics([]);
    }
    setUploadTitle(''); setUploadUrl(''); setUploadFile(null); setUploadType('pdf'); setShowUpload(true);
  };
  const handleUpload = async () => {
    if (!uploadTitle.trim()) { toast.error('Enter a title'); return; }
    if (!uploadSubTopicId)   { toast.error('Select a sub-topic to upload to'); return; }
    setUploading(true);
    try {
      let url = uploadUrl;
      if (uploadFile) {
        const path = `${Date.now()}-${uploadFile.name}`;
        const { error: uploadError } = await supabase.storage.from('study-materials').upload(path, uploadFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('study-materials').getPublicUrl(path);
        url = urlData.publicUrl;
      }
      if (!url) { toast.error('Provide a file or URL'); setUploading(false); return; }
      if (uploadType === 'video' && !uploadFile && !/(youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com|\.mp4($|\?))/i.test(url)) {
        toast.error('Please add a valid video link'); setUploading(false); return;
      }
      const { error } = await supabase.from('materials').insert({
        title: uploadTitle.trim(), type: uploadType, url, sub_topic_id: uploadSubTopicId,
        file_size: uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB` : null,
      });
      if (error) throw error;
      toast.success('Material uploaded!'); setShowUpload(false);
      if (level === 'materials' && selectedSubTopic?.id === uploadSubTopicId) await loadMaterials(uploadSubTopicId);
      const { data: refreshed } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      setAllMaterials((refreshed as Material[]) || []);
    } catch (err: any) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const breadcrumbs = [
    { label: 'Knowledge Vault', level: 'subjects' as Level },
    ...(selectedSubject  ? [{ label: selectedSubject.name,  level: 'topics'     as Level }] : []),
    ...(selectedTopic    ? [{ label: selectedTopic.name,    level: 'sub_topics' as Level }] : []),
    ...(selectedSubTopic ? [{ label: selectedSubTopic.name, level: 'materials'  as Level }] : []),
  ];

  const filteredMaterials = useMemo(() => {
    let m = materials.filter(mat => mat.type === activeTab);
    if (yearFilter && activeTab === 'pyq') m = m.filter(mat => mat.year === yearFilter);
    return m;
  }, [materials, activeTab, yearFilter]);

  const availableYears = useMemo(() => {
    const years = materials.filter(m => m.type === 'pyq' && m.year).map(m => m.year!);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [materials]);

  const selectClass = 'w-full px-3 py-2.5 rounded-lg border text-sm outline-none appearance-none';
  const selectStyle = { background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' };

  if (loading && level === 'subjects' && subjects.length === 0) {
    return (
      <div className="vault-loading-screen">
        <div className="vault-loader-orb" />
        <p className="vault-loader-text">Opening the ज्ञान Vault…</p>
      </div>
    );
  }

  return (
    <>
      <style>{VAULT_CSS}</style>

      <div className="vault-root" onMouseMove={e => { on3DMove(e); onLightMove(e); }}>

        {/* 3D background canvas */}
        <canvas ref={canvasRef} className="vault-canvas" aria-hidden />

        {/* Cursor glow light */}
        <div ref={lightRef} className="vault-cursor-light" aria-hidden />

        {/* Atmospheric overlay */}
        <div className="vault-fog" aria-hidden />

        {/* Sanskrit ambient strip */}
        <div className="vault-sanskrit-bg" aria-hidden>
          ॐ नमो भगवते · सा विद्या या विमुक्तये · ज्ञानं परमं ध्येयम् · तमसो मा ज्योतिर्गमय ·&nbsp;
        </div>

        {/* Main content */}
        <motion.div className="vault-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: sceneReady ? 1 : 0, y: sceneReady ? 0 : 24 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

          {/* Header */}
          <motion.div className="vault-header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="vault-header-left">
              <span className="vault-header-icon">📚</span>
              <div>
                <h1 className="vault-title">Knowledge Vault</h1>
                <p className="vault-subtitle">ज्ञान भंडार — Ancient Wisdom, Modern Learning</p>
              </div>
            </div>
            <button onClick={openUploadModal} className="vault-upload-btn"><Upload size={13} /> Upload</button>
          </motion.div>

          {/* Breadcrumb */}
          <div className="vault-breadcrumb">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="vault-breadcrumb-item">
                {i > 0 && <ChevronRight size={11} className="vault-breadcrumb-sep" />}
                <button onClick={() => {
                  if (bc.level === 'subjects') navigateTo('subjects');
                  else if (bc.level === 'topics' && selectedSubject) navigateTo('topics', selectedSubject);
                  else if (bc.level === 'sub_topics' && selectedTopic) navigateTo('sub_topics', selectedTopic);
                }} className={`vault-breadcrumb-btn ${i === breadcrumbs.length - 1 ? 'active' : ''}`}>
                  {i === 0 && <Home size={11} style={{ display: 'inline', marginRight: 3 }} />}{bc.label}
                </button>
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="vault-search-wrap">
            <Search size={15} className="vault-search-icon" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes, videos, PYQs across all topics…" className="vault-search-input" />
            {searchQuery.trim() && (
              <div className="vault-search-results">
                {searching ? <div className="vault-search-empty">Searching…</div>
                : searchResults.length === 0 ? <div className="vault-search-empty">No results found</div>
                : searchResults.map(m => (
                  <button key={m.id} onClick={() => { openMaterial(m); setSearchQuery(''); }} className="vault-search-result-row">
                    <span className="vault-result-icon">{typeEmoji[m.type]}</span>
                    <div className="vault-result-info">
                      <p className="vault-result-title">{m.title}</p>
                      <p className="vault-result-meta">{typeLabels[m.type]}{m.file_size && ` · ${m.file_size}`}</p>
                    </div>
                    <ExternalLink size={11} className="vault-result-arrow" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="vault-error">
              <span>{error}</span>
              <button onClick={() => window.location.reload()} className="vault-error-retry">Retry</button>
            </div>
          )}

          {/* Stream selector */}
          {level === 'subjects' && (
            <div className="vault-stream-row">
              {!showExplore && selectedStreamId && (
                <span className="vault-stream-badge">
                  {streams.find(s => s.id === selectedStreamId)?.icon}&nbsp;
                  {streams.find(s => s.id === selectedStreamId)?.name}
                </span>
              )}
              <button onClick={() => setShowExplore(!showExplore)} className="vault-explore-btn">
                <Globe size={11} /> {showExplore ? 'My Stream' : 'Explore All Streams'}
              </button>
              {showExplore && (
                <div className="vault-stream-chips">
                  {streams.map(s => (
                    <button key={s.id} onClick={() => { setSelectedStreamId(s.id); setShowExplore(false); }}
                      className={`vault-stream-chip ${selectedStreamId === s.id ? 'active' : ''}`}>
                      {s.icon} {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* SUBJECTS */}
            {level === 'subjects' && (
              <motion.div key="subjects" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
                <div className="vault-grid">
                  {filteredSubjects.map((sub, i) => {
                    const counts = materialCounts[sub.id];
                    return (
                      <motion.div key={sub.id} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.055, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                        <TiltCard onClick={() => navigateTo('topics', sub)} className="vault-subject-card">
                          <div className="vault-card-corner" aria-hidden>ज्ञ</div>
                          <div className="vault-subject-inner">
                            <div className="vault-subject-icon">{sub.icon}</div>
                            <div className="vault-subject-info">
                              <p className="vault-subject-name">{sub.name}</p>
                              <p className="vault-subject-desc">{sub.description}</p>
                              {counts && (
                                <div className="vault-counts">
                                  {counts.pdf   > 0 && <span className="vault-count-badge pdf"><FileText size={9} /> {counts.pdf}</span>}
                                  {counts.video > 0 && <span className="vault-count-badge video"><Video size={9} /> {counts.video}</span>}
                                  {counts.pyq   > 0 && <span className="vault-count-badge pyq"><ClipboardList size={9} /> {counts.pyq}</span>}
                                </div>
                              )}
                            </div>
                            <ChevronRight size={15} className="vault-chevron" />
                          </div>
                        </TiltCard>
                      </motion.div>
                    );
                  })}
                </div>
                {filteredSubjects.length === 0 && (
                  <div className="vault-empty"><BookOpen size={30} className="vault-empty-icon" /><p>No subjects found for this stream</p></div>
                )}
                {recentMaterials.length > 0 && (
                  <div className="vault-recent">
                    <h3 className="vault-section-title"><Clock size={13} className="vault-section-icon" /> Recently Added</h3>
                    <div className="vault-grid vault-grid-sm">
                      {recentMaterials.map((m, i) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <TiltCard onClick={() => openMaterial(m)} className="vault-recent-card">
                            <div className={`vault-mat-icon ${m.type}`}>{typeEmoji[m.type]}</div>
                            <div className="vault-recent-info">
                              <p className="vault-recent-title">{m.title}</p>
                              <div className="vault-recent-meta">
                                <span className="vault-type-badge">{typeLabels[m.type]}</span>
                                {m.subjectName && <span className="vault-subject-name-sm">{m.subjectName}</span>}
                              </div>
                            </div>
                            <ExternalLink size={11} className="vault-result-arrow" />
                          </TiltCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TOPICS */}
            {level === 'topics' && (
              <motion.div key="topics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
                {loading ? <div className="vault-loading"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div> : (
                  <div className="vault-grid">
                    {topics.map((t, i) => (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <TiltCard onClick={() => navigateTo('sub_topics', t)} className="vault-topic-card">
                          <div className="vault-card-corner" aria-hidden>विद्या</div>
                          <p className="vault-topic-name">{t.name}</p>
                          <p className="vault-topic-desc">{t.description}</p>
                          <ChevronRight size={14} className="vault-chevron vault-chevron-sm" />
                        </TiltCard>
                      </motion.div>
                    ))}
                  </div>
                )}
                {!loading && topics.length === 0 && <div className="vault-empty"><p>No topics available yet</p></div>}
              </motion.div>
            )}

            {/* SUB-TOPICS */}
            {level === 'sub_topics' && (
              <motion.div key="subtopics" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}>
                {loading ? <div className="vault-loading"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div> : (
                  <div className="vault-grid">
                    {subTopics.map((st, i) => (
                      <motion.div key={st.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <TiltCard onClick={() => navigateTo('materials', st)} className="vault-topic-card">
                          <div className="vault-card-corner" aria-hidden>सूत्र</div>
                          <p className="vault-topic-name">{st.name}</p>
                          <p className="vault-topic-desc">{st.description}</p>
                          <div className="vault-mat-icons-row"><FileText size={10} /><Video size={10} /><ClipboardList size={10} /></div>
                        </TiltCard>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* MATERIALS */}
            {level === 'materials' && (
              <motion.div key="materials" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }} className="vault-mat-section">
                <div className="vault-tabs">
                  {(['pdf', 'video', 'pyq'] as const).map(tab => {
                    const Icon = typeIcons[tab];
                    return (
                      <button key={tab} onClick={() => { setActiveTab(tab); setYearFilter(null); }} className={`vault-tab ${activeTab === tab ? 'active' : ''}`}>
                        <Icon size={13} /> {typeLabels[tab]}
                      </button>
                    );
                  })}
                </div>
                {activeTab === 'pyq' && availableYears.length > 0 && (
                  <div className="vault-year-filter">
                    <Filter size={11} style={{ color: 'hsl(var(--muted))' }} />
                    <button onClick={() => setYearFilter(null)} className={`vault-year-btn ${!yearFilter ? 'active' : ''}`}>All</button>
                    {availableYears.map(y => <button key={y} onClick={() => setYearFilter(y)} className={`vault-year-btn ${yearFilter === y ? 'active' : ''}`}>{y}</button>)}
                  </div>
                )}
                {loading ? <div className="vault-loading"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
                : filteredMaterials.length === 0 ? (
                  <div className="vault-empty">
                    <div className="vault-empty-emoji">{typeEmoji[activeTab]}</div>
                    <p>No {typeLabels[activeTab].toLowerCase()} available yet</p>
                    <button onClick={openUploadModal} className="vault-empty-upload">Upload the first one!</button>
                  </div>
                ) : (
                  <div className="vault-grid vault-grid-2">
                    {filteredMaterials.map((m, i) => (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <TiltCard className="vault-mat-card">
                          <div className={`vault-mat-icon-lg ${m.type}`}>
                            {m.type === 'pdf' ? <FileText size={18} /> : m.type === 'video' ? <Play size={18} /> : <ClipboardList size={18} />}
                          </div>
                          <div className="vault-mat-info">
                            <p className="vault-mat-title">{m.title}</p>
                            <div className="vault-mat-meta">
                              {m.file_size && <span>{m.file_size}</span>}
                              {m.duration  && <span>⏱ {m.duration}</span>}
                              {m.year      && <span className="vault-year-pill">{m.year}</span>}
                            </div>
                            <div className="vault-mat-actions">
                              <button onClick={() => openMaterial(m)} className="vault-action-open">
                                {m.type === 'video' ? <><Play size={9} /> Watch</> : <><ExternalLink size={9} /> Open</>}
                              </button>
                              {m.type !== 'video' && (
                                <a href={m.url} download target="_blank" rel="noopener noreferrer" className="vault-action-dl">
                                  <Download size={9} /> Download
                                </a>
                              )}
                            </div>
                          </div>
                        </TiltCard>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Upload modal */}
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="vault-modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowUpload(false); }}>
            <motion.div initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }} className="vault-modal">

              <div className="vault-modal-header">
                <h4 className="vault-modal-title"><Upload size={14} className="vault-modal-icon" /> Upload Material</h4>
                <button onClick={() => setShowUpload(false)} className="vault-modal-close"><X size={15} /></button>
              </div>

              <div className="vault-field">
                <label className="vault-label">Stream</label>
                <select value={uploadStreamId || ''} onChange={e => handleUploadStreamChange(e.target.value)} className={selectClass} style={selectStyle}>
                  <option value="">Select stream…</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>

              {uploadStreamId && (
                <div className="vault-field">
                  <label className="vault-label vault-label-row">Subject <button type="button" onClick={() => setCreatingSubject(!creatingSubject)} className="vault-new-btn"><Plus size={9} /> New</button></label>
                  {creatingSubject ? (
                    <div className="vault-inline-create">
                      <input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="New subject name" className="vault-mini-input" style={selectStyle} />
                      <button onClick={async () => {
                        if (!newSubjectName.trim()) return;
                        const { data, error } = await supabase.from('subjects').insert({ name: newSubjectName.trim(), stream_id: uploadStreamId }).select().single();
                        if (data) { setUploadSubjects(p => [...p, data as Subject]); setUploadSubjectId(data.id); setNewSubjectName(''); setCreatingSubject(false); }
                        if (error) toast.error(error.message);
                      }} className="vault-add-btn">Add</button>
                    </div>
                  ) : (
                    <select value={uploadSubjectId || ''} onChange={e => handleUploadSubjectChange(e.target.value)} className={selectClass} style={selectStyle}>
                      <option value="">Select subject…</option>
                      {uploadSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              )}

              {uploadSubjectId && (
                <div className="vault-field">
                  <label className="vault-label vault-label-row">Topic <button type="button" onClick={() => setCreatingTopic(!creatingTopic)} className="vault-new-btn"><Plus size={9} /> New</button></label>
                  {creatingTopic ? (
                    <div className="vault-inline-create">
                      <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} placeholder="New topic name" className="vault-mini-input" style={selectStyle} />
                      <button onClick={async () => {
                        if (!newTopicName.trim()) return;
                        const { data, error } = await supabase.from('topics').insert({ name: newTopicName.trim(), subject_id: uploadSubjectId }).select().single();
                        if (data) { setUploadTopics(p => [...p, data as Topic]); setUploadTopicId(data.id); setNewTopicName(''); setCreatingTopic(false); }
                        if (error) toast.error(error.message);
                      }} className="vault-add-btn">Add</button>
                    </div>
                  ) : (
                    <select value={uploadTopicId || ''} onChange={e => handleUploadTopicChange(e.target.value)} className={selectClass} style={selectStyle}>
                      <option value="">Select topic…</option>
                      {uploadTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
              )}

              {uploadTopicId && (
                <div className="vault-field">
                  <label className="vault-label vault-label-row">Sub-topic <button type="button" onClick={() => setCreatingSubTopic(!creatingSubTopic)} className="vault-new-btn"><Plus size={9} /> New</button></label>
                  {creatingSubTopic ? (
                    <div className="vault-inline-create">
                      <input value={newSubTopicName} onChange={e => setNewSubTopicName(e.target.value)} placeholder="New sub-topic" className="vault-mini-input" style={selectStyle} />
                      <button onClick={async () => {
                        if (!newSubTopicName.trim()) return;
                        const { data, error } = await supabase.from('sub_topics').insert({ name: newSubTopicName.trim(), topic_id: uploadTopicId }).select().single();
                        if (data) { setUploadSubTopics(p => [...p, data as SubTopic]); setUploadSubTopicId(data.id); setNewSubTopicName(''); setCreatingSubTopic(false); }
                        if (error) toast.error(error.message);
                      }} className="vault-add-btn">Add</button>
                    </div>
                  ) : (
                    <select value={uploadSubTopicId || ''} onChange={e => setUploadSubTopicId(e.target.value)} className={selectClass} style={selectStyle}>
                      <option value="">Select sub-topic…</option>
                      {uploadSubTopics.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  )}
                </div>
              )}

              <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Material title"
                className="vault-mini-input" style={{ ...selectStyle, width: '100%', padding: '10px 12px' }} />

              <div className="vault-type-row">
                {(['pdf', 'video', 'pyq'] as const).map(t => (
                  <button key={t} onClick={() => setUploadType(t)} className={`vault-type-btn ${uploadType === t ? 'active' : ''}`}>
                    {typeEmoji[t]} {typeLabels[t]}
                  </button>
                ))}
              </div>

              <input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} placeholder="Paste URL (YouTube, Drive…)"
                className="vault-mini-input" style={{ ...selectStyle, width: '100%', padding: '10px 12px' }} />
              <div className="vault-or">— or —</div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.mp4,.mov,.webm" className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              <button onClick={() => fileInputRef.current?.click()} className="vault-file-btn">
                {uploadFile ? uploadFile.name : 'Click to upload a file'}
              </button>
              <button onClick={handleUpload} disabled={uploading || !uploadTitle.trim() || !uploadSubTopicId} className="vault-submit-btn">
                {uploading ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : <><Upload size={13} /> Upload Material</>}
              </button>
            </motion.div>
          </motion.div>
        )}

      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   VAULT CSS — scoped styles injected as <style> tag
═══════════════════════════════════════════════════════════ */
const VAULT_CSS = `
.vault-root{position:relative;min-height:100vh;overflow:hidden}
.vault-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.9}
.vault-cursor-light{position:absolute;width:360px;height:360px;border-radius:50%;pointer-events:none;z-index:1;transform:translate(-50%,-50%);background:radial-gradient(circle at center,rgba(198,160,40,.09) 0%,rgba(255,153,51,.05) 40%,transparent 70%);filter:blur(2px)}
.vault-fog{position:fixed;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse 70% 50% at 10% 15%,rgba(198,160,40,.07) 0%,transparent 65%),radial-gradient(ellipse 55% 40% at 90% 80%,rgba(255,153,51,.05) 0%,transparent 65%),radial-gradient(ellipse 45% 35% at 50% 50%,rgba(0,0,0,.16) 0%,transparent 70%)}
.vault-sanskrit-bg{position:fixed;bottom:16px;left:0;right:0;text-align:center;font-family:'Playfair Display',serif;font-size:10px;letter-spacing:.22em;color:hsl(var(--accent));opacity:.06;pointer-events:none;z-index:1;user-select:none;white-space:nowrap;overflow:hidden}
.vault-content{position:relative;z-index:2;max-width:900px;margin:0 auto;padding:24px 16px 80px}
.vault-loading-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px}
.vault-loader-orb{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(198,160,40,.9),rgba(120,80,0,.6));box-shadow:0 0 30px rgba(198,160,40,.6),0 0 60px rgba(198,160,40,.3);animation:vaultPulse 2s ease-in-out infinite}
.vault-loader-text{font-family:'Playfair Display',serif;font-size:13px;letter-spacing:.1em;color:hsl(var(--accent));opacity:.7}
@keyframes vaultPulse{0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(198,160,40,.6)}50%{transform:scale(1.15);box-shadow:0 0 50px rgba(198,160,40,.9)}}
.vault-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;gap:12px}
.vault-header-left{display:flex;align-items:center;gap:12px}
.vault-header-icon{font-size:28px;filter:drop-shadow(0 0 12px rgba(198,160,40,.6));animation:vaultFloat 4s ease-in-out infinite}
@keyframes vaultFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.vault-title{font-family:'Playfair Display',serif;font-size:clamp(17px,3vw,22px);font-weight:700;margin:0 0 2px;background:linear-gradient(135deg,hsl(var(--text)) 0%,hsl(var(--accent)) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.vault-subtitle{font-family:'Playfair Display',serif;font-size:10px;letter-spacing:.12em;color:hsl(var(--accent));opacity:.6;margin:0}
.vault-upload-btn{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:600;background:rgba(198,160,40,.12);border:1px solid rgba(198,160,40,.3);color:hsl(var(--accent));cursor:pointer;backdrop-filter:blur(8px);transition:all .2s ease;white-space:nowrap;flex-shrink:0}
.vault-upload-btn:hover{background:rgba(198,160,40,.22);border-color:rgba(198,160,40,.55);transform:translateY(-1px)}
.vault-breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:14px}
.vault-breadcrumb-item{display:flex;align-items:center;gap:4px}
.vault-breadcrumb-sep{color:hsl(var(--muted));opacity:.5}
.vault-breadcrumb-btn{font-size:11px;font-weight:500;color:hsl(var(--accent));background:none;border:none;cursor:pointer;padding:0;transition:opacity .2s}
.vault-breadcrumb-btn:hover{opacity:.7}
.vault-breadcrumb-btn.active{color:hsl(var(--text));cursor:default}
.vault-search-wrap{position:relative;margin-bottom:14px}
.vault-search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:hsl(var(--muted));pointer-events:none}
.vault-search-input{width:100%;padding:11px 16px 11px 40px;border-radius:14px;border:1px solid rgba(198,160,40,.18);background:rgba(255,255,255,.06);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:hsl(var(--text));font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s;box-shadow:0 2px 12px rgba(0,0,0,.08);box-sizing:border-box}
.vault-search-input::placeholder{color:hsl(var(--muted))}
.vault-search-input:focus{border-color:rgba(198,160,40,.45);box-shadow:0 0 0 3px rgba(198,160,40,.1),0 4px 16px rgba(0,0,0,.1)}
[data-theme="paper"] .vault-search-input{background:rgba(255,248,235,.7)}
.vault-search-results{position:absolute;top:calc(100% + 6px);left:0;right:0;background:rgba(18,14,6,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(198,160,40,.22);border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.35);z-index:50;max-height:260px;overflow-y:auto}
[data-theme="paper"] .vault-search-results{background:rgba(255,248,235,.97)}
.vault-search-empty{padding:16px;text-align:center;font-size:12px;color:hsl(var(--muted))}
.vault-search-result-row{width:100%;display:flex;align-items:center;gap:10px;padding:11px 14px;background:none;border:none;border-bottom:1px solid rgba(198,160,40,.08);cursor:pointer;transition:background .15s;text-align:left}
.vault-search-result-row:last-child{border-bottom:none}
.vault-search-result-row:hover{background:rgba(198,160,40,.08)}
.vault-result-icon{color:hsl(var(--accent));flex-shrink:0}
.vault-result-info{flex:1;min-width:0}
.vault-result-title{font-size:12px;font-weight:500;color:hsl(var(--text));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
.vault-result-meta{font-size:10px;color:hsl(var(--muted));margin:2px 0 0}
.vault-result-arrow{color:hsl(var(--accent));flex-shrink:0;opacity:.7}
.vault-error{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:12px;background:rgba(198,160,40,.07);border:1px solid rgba(198,160,40,.2);font-size:12px;color:hsl(var(--muted));margin-bottom:12px}
.vault-error-retry{font-size:11px;font-weight:600;color:hsl(var(--accent));background:none;border:none;cursor:pointer;white-space:nowrap}
.vault-stream-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.vault-stream-badge{padding:5px 12px;border-radius:8px;font-size:11px;font-weight:600;background:rgba(198,160,40,.13);border:1px solid rgba(198,160,40,.35);color:hsl(var(--accent))}
.vault-explore-btn{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:8px;font-size:11px;font-weight:500;border:1px solid rgba(198,160,40,.25);background:transparent;color:hsl(var(--accent));cursor:pointer;transition:all .2s}
.vault-explore-btn:hover{background:rgba(198,160,40,.1)}
.vault-stream-chips{display:flex;flex-wrap:wrap;gap:6px;width:100%}
.vault-stream-chip{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:500;background:rgba(255,255,255,.05);border:1px solid rgba(198,160,40,.15);color:hsl(var(--text));cursor:pointer;transition:all .18s}
.vault-stream-chip.active,.vault-stream-chip:hover{background:rgba(198,160,40,.15);border-color:rgba(198,160,40,.4);color:hsl(var(--accent))}
.vault-glass-card{background:rgba(255,255,255,.055);border:1px solid rgba(198,160,40,.14);border-radius:18px;box-shadow:0 4px 24px rgba(0,0,0,.12),0 1px 0 rgba(255,255,255,.1) inset;backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5);padding:clamp(14px,2.5vw,20px);cursor:pointer;will-change:transform;text-align:left;width:100%}
[data-theme="paper"] .vault-glass-card{background:rgba(255,248,235,.72);border-color:rgba(198,160,40,.2)}
[data-theme="forest"] .vault-glass-card,[data-theme="dusk"] .vault-glass-card{background:rgba(255,255,255,.04);border-color:rgba(198,160,40,.1)}
.vault-sheen{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,transparent 25%,rgba(255,255,255,.06) 40%,rgba(255,255,255,.11) 50%,rgba(255,255,255,.06) 60%,transparent 75%);background-size:250% 100%;background-position:-100% 0;transition:background-position 0s;z-index:1}
.vault-glass-card:hover .vault-sheen{background-position:200% 0;transition:background-position .5s ease}
.vault-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.vault-grid-sm{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.vault-grid-2{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.vault-card-corner{position:absolute;top:9px;right:12px;font-family:'Playfair Display',serif;font-size:8px;letter-spacing:.12em;color:hsl(var(--accent));opacity:.18;user-select:none;z-index:2}
.vault-subject-card{position:relative}
.vault-subject-inner{display:flex;align-items:center;gap:12px;position:relative;z-index:2}
.vault-subject-icon{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(198,160,40,.1);border:1px solid rgba(198,160,40,.18);flex-shrink:0;box-shadow:0 0 16px rgba(198,160,40,.15) inset}
.vault-subject-info{flex:1;min-width:0}
.vault-subject-name{font-size:13px;font-weight:600;color:hsl(var(--text));margin:0 0 2px;font-family:'Playfair Display',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-subject-desc{font-size:10px;color:hsl(var(--muted));margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-counts{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.vault-count-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:600}
.vault-count-badge.pdf{background:rgba(220,50,50,.1);color:hsl(var(--danger))}
.vault-count-badge.video{background:rgba(198,160,40,.12);color:hsl(var(--accent))}
.vault-count-badge.pyq{background:rgba(200,140,40,.12);color:hsl(var(--warning))}
.vault-chevron{color:hsl(var(--accent));opacity:0;flex-shrink:0;transition:opacity .2s}
.vault-glass-card:hover .vault-chevron{opacity:1}
.vault-chevron-sm{color:hsl(var(--accent));opacity:0;transition:opacity .2s;margin-top:6px;display:block}
.vault-glass-card:hover .vault-chevron-sm{opacity:1}
.vault-topic-card{position:relative}
.vault-topic-name{font-size:13px;font-weight:600;color:hsl(var(--text));font-family:'Playfair Display',serif;position:relative;z-index:2;margin:0 0 5px}
.vault-topic-desc{font-size:10px;color:hsl(var(--muted));margin:0;position:relative;z-index:2}
.vault-mat-icons-row{display:flex;gap:6px;margin-top:8px;color:hsl(var(--muted));opacity:.5;position:relative;z-index:2}
.vault-recent{margin-top:28px}
.vault-section-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:hsl(var(--text));margin:0 0 12px;display:flex;align-items:center;gap:6px}
.vault-section-icon{color:hsl(var(--accent))}
.vault-recent-card{display:flex;align-items:flex-start;gap:10px}
.vault-mat-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.vault-mat-icon.pdf{background:rgba(220,50,50,.12);color:hsl(var(--danger))}
.vault-mat-icon.video{background:rgba(198,160,40,.12);color:hsl(var(--accent))}
.vault-mat-icon.pyq{background:rgba(200,140,40,.12);color:hsl(var(--warning))}
.vault-recent-info{flex:1;min-width:0;position:relative;z-index:2}
.vault-recent-title{font-size:11px;font-weight:500;color:hsl(var(--text));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0}
.vault-recent-meta{display:flex;align-items:center;gap:5px;margin-top:3px}
.vault-type-badge{font-size:9px;padding:1px 6px;border-radius:6px;background:rgba(255,255,255,.08);color:hsl(var(--muted))}
.vault-subject-name-sm{font-size:9px;color:hsl(var(--muted));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-empty{text-align:center;padding:50px 20px}
.vault-empty-icon{color:hsl(var(--muted));opacity:.4;margin:0 auto 10px;display:block}
.vault-empty p{font-size:13px;color:hsl(var(--muted))}
.vault-empty-emoji{font-size:28px;margin-bottom:10px;opacity:.5}
.vault-empty-upload{font-size:11px;font-weight:600;color:hsl(var(--accent));text-decoration:underline;background:none;border:none;cursor:pointer;margin-top:8px}
.vault-loading{display:flex;justify-content:center;padding:50px 0}
.vault-mat-section{display:flex;flex-direction:column;gap:12px}
.vault-tabs{display:flex;gap:4px;padding:4px;background:rgba(255,255,255,.05);backdrop-filter:blur(10px);border-radius:14px;border:1px solid rgba(198,160,40,.12)}
.vault-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 10px;border-radius:10px;font-size:11px;font-weight:500;background:transparent;border:none;color:hsl(var(--muted));cursor:pointer;transition:all .2s}
.vault-tab.active{background:rgba(198,160,40,.14);color:hsl(var(--accent));border:1px solid rgba(198,160,40,.28);box-shadow:0 2px 8px rgba(198,160,40,.12)}
.vault-year-filter{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vault-year-btn{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:500;background:transparent;border:1px solid rgba(198,160,40,.15);color:hsl(var(--muted));cursor:pointer;transition:all .18s}
.vault-year-btn.active{background:rgba(198,160,40,.15);border-color:rgba(198,160,40,.4);color:hsl(var(--accent))}
.vault-mat-card{display:flex;align-items:flex-start;gap:12px}
.vault-mat-icon-lg{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.vault-mat-icon-lg.pdf{background:rgba(220,50,50,.12);color:hsl(var(--danger))}
.vault-mat-icon-lg.video{background:rgba(198,160,40,.12);color:hsl(var(--accent))}
.vault-mat-icon-lg.pyq{background:rgba(200,140,40,.12);color:hsl(var(--warning))}
.vault-mat-info{flex:1;min-width:0;position:relative;z-index:2}
.vault-mat-title{font-size:12px;font-weight:500;color:hsl(var(--text));margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vault-mat-meta{display:flex;align-items:center;gap:8px;font-size:10px;color:hsl(var(--muted));margin-bottom:8px}
.vault-year-pill{padding:1px 6px;border-radius:6px;background:rgba(200,140,40,.12);color:hsl(var(--warning));font-weight:600}
.vault-mat-actions{display:flex;gap:6px}
.vault-action-open{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:7px;font-size:10px;font-weight:500;background:rgba(198,160,40,.14);color:hsl(var(--accent));border:none;cursor:pointer;transition:all .18s;text-decoration:none}
.vault-action-open:hover{background:rgba(198,160,40,.24)}
.vault-action-dl{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:7px;font-size:10px;font-weight:500;background:rgba(255,255,255,.07);color:hsl(var(--text));border:none;cursor:pointer;transition:all .18s;text-decoration:none}
.vault-action-dl:hover{background:rgba(255,255,255,.12)}
.vault-modal-overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.65);backdrop-filter:blur(4px)}
.vault-modal{width:100%;max-width:430px;background:rgba(18,14,6,.94);border:1px solid rgba(198,160,40,.25);border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.5),0 0 0 1px rgba(198,160,40,.08) inset;backdrop-filter:blur(24px);max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
[data-theme="paper"] .vault-modal{background:rgba(255,248,235,.97);border-color:rgba(198,160,40,.3)}
.vault-modal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.vault-modal-title{font-size:13px;font-weight:600;color:hsl(var(--text));display:flex;align-items:center;gap:6px;font-family:'Playfair Display',serif}
.vault-modal-icon{color:hsl(var(--accent))}
.vault-modal-close{background:none;border:none;cursor:pointer;color:hsl(var(--muted));padding:4px;border-radius:6px;transition:background .15s}
.vault-modal-close:hover{background:rgba(255,255,255,.08)}
.vault-field{display:flex;flex-direction:column;gap:4px}
.vault-label{font-size:11px;font-weight:500;color:hsl(var(--muted))}
.vault-label-row{display:flex;align-items:center;justify-content:space-between}
.vault-new-btn{display:inline-flex;align-items:center;gap:2px;font-size:9px;color:hsl(var(--accent));background:none;border:none;cursor:pointer}
.vault-inline-create{display:flex;gap:6px}
.vault-mini-input{padding:8px 11px;border-radius:9px;border:1px solid rgba(198,160,40,.2);font-size:12px;outline:none;transition:border-color .2s;flex:1}
.vault-mini-input:focus{border-color:rgba(198,160,40,.5)}
.vault-add-btn{padding:8px 14px;border-radius:9px;font-size:11px;font-weight:600;background:rgba(198,160,40,.2);color:hsl(var(--accent));border:1px solid rgba(198,160,40,.3);cursor:pointer;white-space:nowrap;transition:all .2s}
.vault-add-btn:hover{background:rgba(198,160,40,.32)}
.vault-type-row{display:flex;flex-wrap:wrap;gap:6px}
.vault-type-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:9px;font-size:11px;font-weight:500;background:transparent;border:1px solid rgba(198,160,40,.15);color:hsl(var(--text));cursor:pointer;transition:all .18s}
.vault-type-btn.active{background:rgba(198,160,40,.15);border-color:rgba(198,160,40,.4);color:hsl(var(--accent))}
.vault-or{text-align:center;font-size:10px;color:hsl(var(--muted))}
.vault-file-btn{width:100%;padding:13px;border-radius:12px;border:2px dashed rgba(198,160,40,.25);background:rgba(198,160,40,.04);font-size:12px;color:hsl(var(--muted));cursor:pointer;transition:all .2s}
.vault-file-btn:hover{border-color:rgba(198,160,40,.5);background:rgba(198,160,40,.08)}
.vault-submit-btn{width:100%;padding:11px;border-radius:12px;font-size:13px;font-weight:600;background:linear-gradient(135deg,rgba(198,160,40,.85) 0%,rgba(180,120,20,.9) 100%);color:#1a1200;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s;box-shadow:0 4px 16px rgba(198,160,40,.3)}
.vault-submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 24px rgba(198,160,40,.45)}
.vault-submit-btn:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:640px){.vault-grid,.vault-grid-sm,.vault-grid-2{grid-template-columns:1fr}.vault-canvas{opacity:.55}.vault-cursor-light{display:none}}
@media(prefers-reduced-motion:reduce){.vault-header-icon,.vault-loader-orb{animation:none!important}.vault-glass-card{transition:none!important}}
`;

export default KnowledgeVault;
