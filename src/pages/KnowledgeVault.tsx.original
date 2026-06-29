import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, FileText, Video, ClipboardList, ChevronRight, Home, Download, Play, Filter, Loader2, Globe, Upload, X, ExternalLink, Plus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

type Level = 'subjects' | 'topics' | 'sub_topics' | 'materials';

interface Stream { id: string; name: string; icon: string; description: string; }
interface Subject { id: string; name: string; stream_id: string; icon: string; description: string; }
interface Topic { id: string; name: string; subject_id: string; description: string; }
interface SubTopic { id: string; name: string; topic_id: string; description: string; }
interface Material { id: string; title: string; type: string; url: string; sub_topic_id: string; year: number | null; file_size: string | null; duration: string | null; created_at: string | null; }

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, pyq: ClipboardList };
const typeLabels: Record<string, string> = { pdf: 'PDF Notes', video: 'Video Lectures', pyq: 'PYQs' };
const typeEmoji: Record<string, React.ReactNode> = { pdf: <FileText size={14} />, video: <Video size={14} />, pyq: <ClipboardList size={14} /> };

const KnowledgeVault = () => {
  const { user } = useApp();
  const [level, setLevel] = useState<Level>('subjects');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopic | null>(null);
  const [activeTab, setActiveTab] = useState<'pdf' | 'video' | 'pyq'>('pdf');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExplore, setShowExplore] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [materialCounts, setMaterialCounts] = useState<Record<string, { pdf: number; video: number; pyq: number }>>({});
  const [recentMaterials, setRecentMaterials] = useState<(Material & { subjectName?: string })[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Upload modal state (works from anywhere)
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<'pdf' | 'video' | 'pyq'>('pdf');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload selector state (for uploading from main page)
  const [uploadStreamId, setUploadStreamId] = useState<string | null>(null);
  const [uploadSubjectId, setUploadSubjectId] = useState<string | null>(null);
  const [uploadTopicId, setUploadTopicId] = useState<string | null>(null);
  const [uploadSubTopicId, setUploadSubTopicId] = useState<string | null>(null);
  const [uploadSubjects, setUploadSubjects] = useState<Subject[]>([]);
  const [uploadTopics, setUploadTopics] = useState<Topic[]>([]);
  const [uploadSubTopics, setUploadSubTopics] = useState<SubTopic[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newSubTopicName, setNewSubTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [creatingSubTopic, setCreatingSubTopic] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  // All topics/subtopics for mapping
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [allSubTopics, setAllSubTopics] = useState<SubTopic[]>([]);

  const userStreamName = useMemo(() => {
    const map: Record<string, string> = {
      jee: 'Science PCM', neet: 'Science PCB', boards: 'Science PCM',
      engineering: 'Engineering', commerce: 'Commerce', arts: 'Arts', other: 'Science PCM',
    };
    return map[user.examType] || 'Science PCM';
  }, [user.examType]);

  // Load everything
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const [{ data: st, error: e1 }, { data: subs, error: e2 }, { data: allMats, error: e3 }, { data: allT }, { data: allST }] = await Promise.all([
        supabase.from('streams').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('materials').select('*').order('created_at', { ascending: false }),
        supabase.from('topics').select('*').order('name'),
        supabase.from('sub_topics').select('*').order('name'),
      ]);

      if (e1 || e2 || e3) {
        setError('Could not load the knowledge vault right now. Please try again.');
      }

      setStreams((st as Stream[]) || []);
      setSubjects((subs as Subject[]) || []);
      setAllMaterials((allMats as Material[]) || []);
      setAllTopics((allT as Topic[]) || []);
      setAllSubTopics((allST as SubTopic[]) || []);

      const userStream = (st as Stream[])?.find(s => s.name === userStreamName);
      if (userStream) setSelectedStreamId(userStream.id);
      setLoading(false);
    };
    load();
  }, [userStreamName]);

  // Compute material counts per subject and recent materials
  useEffect(() => {
    if (!subjects.length || !allMaterials.length || !allTopics.length || !allSubTopics.length) return;

    const topicToSubject: Record<string, string> = {};
    allTopics.forEach(t => { topicToSubject[t.id] = t.subject_id; });
    const subTopicToSubject: Record<string, string> = {};
    allSubTopics.forEach(st => { subTopicToSubject[st.id] = topicToSubject[st.topic_id] || ''; });

    const counts: Record<string, { pdf: number; video: number; pyq: number }> = {};
    allMaterials.forEach(m => {
      const subjId = subTopicToSubject[m.sub_topic_id] || '';
      if (!subjId) return;
      if (!counts[subjId]) counts[subjId] = { pdf: 0, video: 0, pyq: 0 };
      if (m.type === 'pdf') counts[subjId].pdf++;
      else if (m.type === 'video') counts[subjId].video++;
      else if (m.type === 'pyq') counts[subjId].pyq++;
    });
    setMaterialCounts(counts);

    // Recent materials for user's stream
    const streamSubjectIds = subjects.filter(s => s.stream_id === selectedStreamId).map(s => s.id);
    const recent = allMaterials
      .filter(m => {
        const subjId = subTopicToSubject[m.sub_topic_id];
        return subjId && streamSubjectIds.includes(subjId);
      })
      .slice(0, 6)
      .map(m => {
        const subjId = subTopicToSubject[m.sub_topic_id];
        const subj = subjects.find(s => s.id === subjId);
        return { ...m, subjectName: subj?.name || '' };
      });
    setRecentMaterials(recent);
  }, [subjects, allMaterials, selectedStreamId, allTopics, allSubTopics]);

  const filteredSubjects = useMemo(() => {
    if (showExplore || !selectedStreamId) return subjects;
    return subjects.filter(s => s.stream_id === selectedStreamId);
  }, [subjects, selectedStreamId, showExplore]);

  const loadTopics = async (subjectId: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('name');
    if (error) setError('Could not load topics. Please try again.');
    setTopics((data as Topic[]) || []);
    setLoading(false);
  };

  const loadSubTopics = async (topicId: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('sub_topics').select('*').eq('topic_id', topicId).order('name');
    if (error) setError('Could not load sub-topics. Please try again.');
    setSubTopics((data as SubTopic[]) || []);
    setLoading(false);
  };

  const loadMaterials = async (subTopicId: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('materials').select('*').eq('sub_topic_id', subTopicId).order('created_at', { ascending: false });
    if (error) setError('Could not load materials. Please try again.');
    setMaterials((data as Material[]) || []);
    setLoading(false);
  };

  // Search across materials
  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase.from('materials').select('*').ilike('title', `%${q}%`).limit(20);
    if (error) setError('Search is unavailable right now.');
    setSearchResults((data as Material[]) || []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, handleSearch]);

  const navigateTo = (newLevel: Level, item?: any) => {
    if (newLevel === 'subjects') {
      setLevel('subjects'); setSelectedSubject(null); setSelectedTopic(null); setSelectedSubTopic(null);
    } else if (newLevel === 'topics' && item) {
      setSelectedSubject(item); setLevel('topics'); setSelectedTopic(null); setSelectedSubTopic(null);
      loadTopics(item.id);
    } else if (newLevel === 'sub_topics' && item) {
      setSelectedTopic(item); setLevel('sub_topics'); setSelectedSubTopic(null);
      loadSubTopics(item.id);
    } else if (newLevel === 'materials' && item) {
      setSelectedSubTopic(item); setLevel('materials'); setActiveTab('pdf');
      loadMaterials(item.id);
    }
  };

  const openMaterial = (m: Material) => {
    if (m.url) {
      window.open(m.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No URL available for this material');
    }
  };

  // Upload modal helpers - load cascading dropdowns
  const handleUploadStreamChange = (streamId: string) => {
    setUploadStreamId(streamId);
    setUploadSubjectId(null);
    setUploadTopicId(null);
    setUploadSubTopicId(null);
    setUploadSubjects(subjects.filter(s => s.stream_id === streamId));
    setUploadTopics([]);
    setUploadSubTopics([]);
  };

  const handleUploadSubjectChange = async (subjectId: string) => {
    setUploadSubjectId(subjectId);
    setUploadTopicId(null);
    setUploadSubTopicId(null);
    setUploadSubTopics([]);
    const filtered = allTopics.filter(t => t.subject_id === subjectId);
    setUploadTopics(filtered);
  };

  const handleUploadTopicChange = (topicId: string) => {
    setUploadTopicId(topicId);
    setUploadSubTopicId(null);
    const filtered = allSubTopics.filter(st => st.topic_id === topicId);
    setUploadSubTopics(filtered);
  };

  const openUploadModal = () => {
    // Pre-fill if we're inside a sub-topic
    if (selectedSubTopic && selectedTopic && selectedSubject) {
      setUploadStreamId(selectedSubject.stream_id);
      setUploadSubjects(subjects.filter(s => s.stream_id === selectedSubject.stream_id));
      setUploadSubjectId(selectedSubject.id);
      setUploadTopics(allTopics.filter(t => t.subject_id === selectedSubject.id));
      setUploadTopicId(selectedTopic.id);
      setUploadSubTopics(allSubTopics.filter(st => st.topic_id === selectedTopic.id));
      setUploadSubTopicId(selectedSubTopic.id);
    } else {
      // Start fresh
      if (selectedStreamId) {
        setUploadStreamId(selectedStreamId);
        setUploadSubjects(subjects.filter(s => s.stream_id === selectedStreamId));
      } else {
        setUploadStreamId(null);
        setUploadSubjects([]);
      }
      setUploadSubjectId(null);
      setUploadTopicId(null);
      setUploadSubTopicId(null);
      setUploadTopics([]);
      setUploadSubTopics([]);
    }
    setUploadTitle('');
    setUploadUrl('');
    setUploadFile(null);
    setUploadType('pdf');
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim()) { toast.error('Enter a title'); return; }

    const targetSubTopicId = uploadSubTopicId;
    if (!targetSubTopicId) { toast.error('Select a sub-topic to upload to'); return; }

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
        toast.error('Please add a valid video link');
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('materials').insert({
        title: uploadTitle.trim(),
        type: uploadType,
        url,
        sub_topic_id: targetSubTopicId,
        file_size: uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB` : null,
      });
      if (error) throw error;

      toast.success('Material uploaded!');
      setShowUpload(false);

      // Refresh materials if we're viewing the same sub-topic
      if (level === 'materials' && selectedSubTopic?.id === targetSubTopicId) {
        await loadMaterials(targetSubTopicId);
      }

      // Refresh all materials for counts
      const { data: refreshed } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      setAllMaterials((refreshed as Material[]) || []);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Knowledge Vault', level: 'subjects' as Level },
    ...(selectedSubject ? [{ label: selectedSubject.name, level: 'topics' as Level }] : []),
    ...(selectedTopic ? [{ label: selectedTopic.name, level: 'sub_topics' as Level }] : []),
    ...(selectedSubTopic ? [{ label: selectedSubTopic.name, level: 'materials' as Level }] : []),
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

  if (loading && level === 'subjects' && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--accent))' }} />
      </div>
    );
  }

  const selectClass = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none appearance-none";
  const selectStyle = { background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Breadcrumb + Upload button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs min-w-0">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} style={{ color: 'hsl(var(--muted))' }} />}
              <button
                onClick={() => {
                  if (bc.level === 'subjects') navigateTo('subjects');
                  else if (bc.level === 'topics' && selectedSubject) navigateTo('topics', selectedSubject);
                  else if (bc.level === 'sub_topics' && selectedTopic) navigateTo('sub_topics', selectedTopic);
                }}
                className="font-medium hover:underline"
                style={{ color: i === breadcrumbs.length - 1 ? 'hsl(var(--text))' : 'hsl(var(--accent))' }}
              >
                {i === 0 && <Home size={12} className="inline mr-1" />}
                {bc.label}
              </button>
            </span>
          ))}
        </div>
        <button onClick={openUploadModal}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
          style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
          <Upload size={12} /> Upload
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted))' }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search notes, videos, PYQs across all topics..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
          style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }}
        />
        {searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 max-h-60 overflow-y-auto"
            style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            {searching ? (
              <div className="p-4 text-center text-sm" style={{ color: 'hsl(var(--muted))' }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: 'hsl(var(--muted))' }}>No results found</div>
            ) : searchResults.map(m => (
              <button key={m.id} onClick={() => { openMaterial(m); setSearchQuery(''); }}
                className="w-full text-left p-3 flex items-center gap-3 hover:bg-accent/5 transition-colors border-b last:border-b-0"
                style={{ borderColor: 'hsl(var(--border))' }}>
                <span>{typeEmoji[m.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--text))' }}>{m.title}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{typeLabels[m.type]} {m.file_size && `· ${m.file_size}`}</p>
                </div>
                <ExternalLink size={12} style={{ color: 'hsl(var(--accent))' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-3" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}>
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="text-xs font-semibold" style={{ color: 'hsl(var(--accent))' }}>Retry</button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-2xl border p-5 space-y-3 max-h-[90vh] overflow-y-auto"
            style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Upload size={14} style={{ color: 'hsl(var(--accent))' }} /> Upload Material</h4>
              <button onClick={() => setShowUpload(false)}><X size={16} style={{ color: 'hsl(var(--muted))' }} /></button>
            </div>

            {/* Stream selector */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted))' }}>Stream</label>
              <select value={uploadStreamId || ''} onChange={e => handleUploadStreamChange(e.target.value)} className={selectClass} style={selectStyle}>
                <option value="">Select stream...</option>
                {streams.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            {/* Subject selector with create new */}
            {uploadStreamId && (
              <div>
                <label className="text-xs font-medium mb-1 flex items-center justify-between" style={{ color: 'hsl(var(--muted))' }}>
                  Subject
                  <button type="button" onClick={() => setCreatingSubject(!creatingSubject)} className="text-[10px] flex items-center gap-0.5" style={{ color: 'hsl(var(--accent))' }}><Plus size={10} /> New</button>
                </label>
                {creatingSubject ? (
                  <div className="flex gap-2">
                    <input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="New subject name" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
                    <button onClick={async () => {
                      if (!newSubjectName.trim()) return;
                      const { data, error } = await supabase.from('subjects').insert({ name: newSubjectName.trim(), stream_id: uploadStreamId }).select().single();
                      if (data) { setUploadSubjects(prev => [...prev, data as Subject]); setUploadSubjectId(data.id); setNewSubjectName(''); setCreatingSubject(false); }
                      if (error) toast.error(error.message);
                    }} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--primary-foreground))' }}>Add</button>
                  </div>
                ) : (
                  <select value={uploadSubjectId || ''} onChange={e => handleUploadSubjectChange(e.target.value)} className={selectClass} style={selectStyle}>
                    <option value="">Select subject...</option>
                    {uploadSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Topic selector with create new */}
            {uploadSubjectId && (
              <div>
                <label className="text-xs font-medium mb-1 flex items-center justify-between" style={{ color: 'hsl(var(--muted))' }}>
                  Topic
                  <button type="button" onClick={() => setCreatingTopic(!creatingTopic)} className="text-[10px] flex items-center gap-0.5" style={{ color: 'hsl(var(--accent))' }}><Plus size={10} /> New</button>
                </label>
                {creatingTopic ? (
                  <div className="flex gap-2">
                    <input value={newTopicName} onChange={e => setNewTopicName(e.target.value)} placeholder="New topic name" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
                    <button onClick={async () => {
                      if (!newTopicName.trim()) return;
                      const { data, error } = await supabase.from('topics').insert({ name: newTopicName.trim(), subject_id: uploadSubjectId }).select().single();
                      if (data) { setUploadTopics(prev => [...prev, data as Topic]); setUploadTopicId(data.id); setNewTopicName(''); setCreatingTopic(false); }
                      if (error) toast.error(error.message);
                    }} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--primary-foreground))' }}>Add</button>
                  </div>
                ) : (
                  <select value={uploadTopicId || ''} onChange={e => handleUploadTopicChange(e.target.value)} className={selectClass} style={selectStyle}>
                    <option value="">Select or type topic...</option>
                    {uploadTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Sub-topic selector with create new */}
            {uploadTopicId && (
              <div>
                <label className="text-xs font-medium mb-1 flex items-center justify-between" style={{ color: 'hsl(var(--muted))' }}>
                  Sub-topic
                  <button type="button" onClick={() => setCreatingSubTopic(!creatingSubTopic)} className="text-[10px] flex items-center gap-0.5" style={{ color: 'hsl(var(--accent))' }}><Plus size={10} /> New</button>
                </label>
                {creatingSubTopic ? (
                  <div className="flex gap-2">
                    <input value={newSubTopicName} onChange={e => setNewSubTopicName(e.target.value)} placeholder="New sub-topic name" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
                    <button onClick={async () => {
                      if (!newSubTopicName.trim()) return;
                      const { data, error } = await supabase.from('sub_topics').insert({ name: newSubTopicName.trim(), topic_id: uploadTopicId }).select().single();
                      if (data) { setUploadSubTopics(prev => [...prev, data as SubTopic]); setUploadSubTopicId(data.id); setNewSubTopicName(''); setCreatingSubTopic(false); }
                      if (error) toast.error(error.message);
                    }} className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--primary-foreground))' }}>Add</button>
                  </div>
                ) : (
                  <select value={uploadSubTopicId || ''} onChange={e => setUploadSubTopicId(e.target.value)} className={selectClass} style={selectStyle}>
                    <option value="">Select sub-topic...</option>
                    {uploadSubTopics.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                )}
              </div>
            )}

            <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Material title"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />

            <div className="flex flex-wrap gap-2">
              {(['pdf', 'video', 'pyq'] as const).map(t => (
                <button key={t} onClick={() => setUploadType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{ background: uploadType === t ? 'hsl(var(--accent-soft))' : 'transparent', borderColor: uploadType === t ? 'hsl(var(--accent))' : 'hsl(var(--border))', color: uploadType === t ? 'hsl(var(--accent))' : 'hsl(var(--text))' }}>
                  {typeEmoji[t]} {typeLabels[t]}
                </button>
              ))}
            </div>

            <input value={uploadUrl} onChange={e => setUploadUrl(e.target.value)} placeholder="Paste URL (YouTube, Google Drive, etc.)"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
            <div className="text-center text-[10px]" style={{ color: 'hsl(var(--muted))' }}>— or —</div>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.mp4,.mov,.webm" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm transition-all hover:border-accent"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}>
              {uploadFile ? uploadFile.name : 'Click to upload a file'}
            </button>
            <button onClick={handleUpload} disabled={uploading || !uploadTitle.trim() || !uploadSubTopicId}
              className="btn-3d w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload</>}
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Stream selector at subject level */}
      {level === 'subjects' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {!showExplore && selectedStreamId && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ background: 'hsl(var(--accent-soft))', borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))' }}>
                {streams.find(s => s.id === selectedStreamId)?.icon} {streams.find(s => s.id === selectedStreamId)?.name}
              </span>
            )}
            <button onClick={() => setShowExplore(!showExplore)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1"
              style={{ borderColor: showExplore ? 'hsl(var(--accent))' : 'hsl(var(--border))', color: 'hsl(var(--accent))', background: showExplore ? 'hsl(var(--accent-soft))' : 'transparent' }}>
              <Globe size={12} /> {showExplore ? 'Show My Stream' : 'Explore Other Streams'}
            </button>
          </div>

          {showExplore && (
            <div className="flex flex-wrap gap-2">
              {streams.map(s => (
                <button key={s.id} onClick={() => { setSelectedStreamId(s.id); setShowExplore(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: selectedStreamId === s.id ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface))',
                    borderColor: selectedStreamId === s.id ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                    color: selectedStreamId === s.id ? 'hsl(var(--accent))' : 'hsl(var(--text))',
                  }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence mode="wait">
        {/* ======= SUBJECTS GRID ======= */}
        {level === 'subjects' && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubjects.map((sub, i) => {
                const counts = materialCounts[sub.id];
                return (
                  <motion.button key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigateTo('topics', sub)}
                    className="card-base text-left hover:border-accent transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: 'hsl(var(--accent-soft))' }}>
                        {sub.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text))' }}>{sub.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'hsl(var(--muted))' }}>{sub.description}</p>
                        {counts && (
                          <div className="flex gap-2 mt-1">
                            {counts.pdf > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: 'hsl(var(--danger) / 0.1)', color: 'hsl(var(--danger))' }}><FileText size={9} /> {counts.pdf}</span>}
                            {counts.video > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}><Video size={9} /> {counts.video}</span>}
                            {counts.pyq > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}><ClipboardList size={9} /> {counts.pyq}</span>}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--accent))' }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
            {filteredSubjects.length === 0 && (
              <div className="text-center py-12">
                <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'hsl(var(--muted))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>No subjects found for this stream</p>
              </div>
            )}

            {/* Recently Added */}
            {recentMaterials.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Clock size={14} style={{ color: 'hsl(var(--accent))' }} /> Recently Added</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentMaterials.map((m, i) => (
                    <motion.button key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => openMaterial(m)}
                      className="card-base text-left flex items-start gap-3 hover:border-accent transition-all">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                        style={{ background: m.type === 'pdf' ? 'hsl(var(--danger) / 0.1)' : m.type === 'video' ? 'hsl(var(--accent-soft))' : 'hsl(var(--warning) / 0.1)' }}>
                        {typeEmoji[m.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--text))' }}>{m.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--muted))' }}>{typeLabels[m.type]}</span>
                          {m.subjectName && <span className="text-[9px]" style={{ color: 'hsl(var(--muted))' }}>{m.subjectName}</span>}
                        </div>
                      </div>
                      <ExternalLink size={12} className="shrink-0 mt-1" style={{ color: 'hsl(var(--accent))' }} />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ======= TOPICS LIST ======= */}
        {level === 'topics' && (
          <motion.div key="topics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.map((t, i) => (
                  <motion.button key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigateTo('sub_topics', t)}
                    className="card-base text-left hover:border-accent transition-all group">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>{t.name}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>{t.description}</p>
                    <ChevronRight size={14} className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--accent))' }} />
                  </motion.button>
                ))}
              </div>
            )}
            {!loading && topics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>No topics available yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ======= SUB-TOPICS LIST ======= */}
        {level === 'sub_topics' && (
          <motion.div key="subtopics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subTopics.map((st, i) => (
                  <motion.button key={st.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => navigateTo('materials', st)}
                    className="card-base text-left hover:border-accent transition-all group">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>{st.name}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>{st.description}</p>
                    <div className="flex gap-2 mt-2">
                      {[<FileText size={10} />, <Video size={10} />, <ClipboardList size={10} />].map((icon, j) => (
                        <span key={j} className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{icon}</span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ======= MATERIALS VIEW ======= */}
        {level === 'materials' && (
          <motion.div key="materials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--surface2))' }}>
              {(['pdf', 'video', 'pyq'] as const).map(tab => {
                const Icon = typeIcons[tab];
                return (
                  <button key={tab} onClick={() => { setActiveTab(tab); setYearFilter(null); }}
                    className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: activeTab === tab ? 'hsl(var(--surface))' : 'transparent',
                      color: activeTab === tab ? 'hsl(var(--text))' : 'hsl(var(--muted))',
                      boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                    }}>
                    <Icon size={14} />
                    {typeLabels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Year filter for PYQs */}
            {activeTab === 'pyq' && availableYears.length > 0 && (
              <div className="flex gap-2 items-center">
                <Filter size={12} style={{ color: 'hsl(var(--muted))' }} />
                <div className="flex gap-1">
                  <button onClick={() => setYearFilter(null)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ background: !yearFilter ? 'hsl(var(--accent-soft))' : 'transparent', color: !yearFilter ? 'hsl(var(--accent))' : 'hsl(var(--muted))' }}>
                    All
                  </button>
                  {availableYears.map(y => (
                    <button key={y} onClick={() => setYearFilter(y)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: yearFilter === y ? 'hsl(var(--accent-soft))' : 'transparent', color: yearFilter === y ? 'hsl(var(--accent))' : 'hsl(var(--muted))' }}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Material cards */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12 card-base">
                <div className="text-3xl mb-2">{typeEmoji[activeTab]}</div>
                <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>No {typeLabels[activeTab].toLowerCase()} available yet</p>
                <button onClick={openUploadModal} className="text-xs font-medium mt-2 underline" style={{ color: 'hsl(var(--accent))' }}>Upload the first one!</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMaterials.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="card-base flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: m.type === 'pdf' ? 'hsl(var(--danger) / 0.1)' : m.type === 'video' ? 'hsl(var(--accent-soft))' : 'hsl(var(--warning) / 0.1)' }}>
                      {m.type === 'pdf' ? <FileText size={18} style={{ color: 'hsl(var(--danger))' }} /> :
                       m.type === 'video' ? <Play size={18} style={{ color: 'hsl(var(--accent))' }} /> :
                       <ClipboardList size={18} style={{ color: 'hsl(var(--warning))' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--text))' }}>{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                        {m.file_size && <span>{m.file_size}</span>}
                        {m.duration && <span>⏱ {m.duration}</span>}
                        {m.year && <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}>{m.year}</span>}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openMaterial(m)}
                          className="text-[10px] font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-all hover:opacity-80"
                          style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
                          {m.type === 'video' ? <><Play size={10} /> Watch</> : <><ExternalLink size={10} /> Open</>}
                        </button>
                        {m.type !== 'video' && (
                          <a href={m.url} download target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-medium px-3 py-1 rounded-lg flex items-center gap-1"
                            style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }}>
                            <Download size={10} /> Download
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeVault;
