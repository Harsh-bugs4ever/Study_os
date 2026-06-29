import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, Video, ClipboardList, X, Plus } from 'lucide-react';

const AdminUpload = () => {
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);

  const [streamId, setStreamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subTopicId, setSubTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'pdf' | 'video' | 'pyq'>('pdf');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addingTo, setAddingTo] = useState<'stream' | 'subject' | 'topic' | 'subtopic' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('streams').select('*').order('name').then(({ data }) => setStreams(data || []));
  }, []);

  useEffect(() => {
    if (streamId) supabase.from('subjects').select('*').eq('stream_id', streamId).order('name').then(({ data }) => { setSubjects(data || []); setSubjectId(''); setTopicId(''); setSubTopicId(''); setTopics([]); setSubTopics([]); });
  }, [streamId]);

  useEffect(() => {
    if (subjectId) supabase.from('topics').select('*').eq('subject_id', subjectId).order('name').then(({ data }) => { setTopics(data || []); setTopicId(''); setSubTopicId(''); setSubTopics([]); });
  }, [subjectId]);

  useEffect(() => {
    if (topicId) supabase.from('sub_topics').select('*').eq('topic_id', topicId).order('name').then(({ data }) => { setSubTopics(data || []); setSubTopicId(''); });
  }, [topicId]);

  const handleAddNew = async () => {
    if (!newItemName.trim()) return;
    try {
      if (addingTo === 'stream') {
        const { data } = await supabase.from('streams').insert({ name: newItemName.trim() }).select().single();
        if (data) { setStreams(prev => [...prev, data]); setStreamId(data.id); }
      } else if (addingTo === 'subject' && streamId) {
        const { data } = await supabase.from('subjects').insert({ name: newItemName.trim(), stream_id: streamId }).select().single();
        if (data) { setSubjects(prev => [...prev, data]); setSubjectId(data.id); }
      } else if (addingTo === 'topic' && subjectId) {
        const { data } = await supabase.from('topics').insert({ name: newItemName.trim(), subject_id: subjectId }).select().single();
        if (data) { setTopics(prev => [...prev, data]); setTopicId(data.id); }
      } else if (addingTo === 'subtopic' && topicId) {
        const { data } = await supabase.from('sub_topics').insert({ name: newItemName.trim(), topic_id: topicId }).select().single();
        if (data) { setSubTopics(prev => [...prev, data]); setSubTopicId(data.id); }
      }
      toast.success(`Added "${newItemName.trim()}"`);
    } catch (err: any) { toast.error(err.message); }
    setNewItemName('');
    setAddingTo(null);
  };

  const handleUpload = async () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (!subTopicId) { toast.error('Select a sub-topic'); return; }
    setUploading(true);
    try {
      let finalUrl = url;
      if (file) {
        const path = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('study-materials').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('study-materials').getPublicUrl(path);
        finalUrl = urlData.publicUrl;
      }
      if (!finalUrl) { toast.error('Provide a file or URL'); setUploading(false); return; }

      const { error } = await supabase.from('materials').insert({
        title: title.trim(), type, url: finalUrl, sub_topic_id: subTopicId,
        file_size: file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : null,
      });
      if (error) throw error;
      toast.success('Uploaded successfully!');
      setTitle(''); setUrl(''); setFile(null);
    } catch (err: any) { toast.error(err.message); }
    setUploading(false);
  };

  const sel = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none appearance-none";
  const selStyle = { background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' };

  const AddButton = ({ target }: { target: typeof addingTo }) => (
    <button onClick={() => setAddingTo(addingTo === target ? null : target)}
      className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
      style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--accent))' }}>
      <Plus size={14} />
    </button>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
        <Upload size={22} style={{ color: 'hsl(var(--accent))' }} /> Upload Resource
      </h2>

      {/* Stream */}
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted))' }}>Stream</label>
        <div className="flex gap-2">
          <select value={streamId} onChange={e => setStreamId(e.target.value)} className={`flex-1 ${sel}`} style={selStyle}>
            <option value="">Select stream...</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <AddButton target="stream" />
        </div>
      </div>

      {addingTo === 'stream' && (
        <div className="flex gap-2">
          <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New stream name" className={`flex-1 ${sel}`} style={selStyle} />
          <button onClick={handleAddNew} className="btn-3d px-4 text-sm">Add</button>
          <button onClick={() => setAddingTo(null)} style={{ color: 'hsl(var(--muted))' }}><X size={16} /></button>
        </div>
      )}

      {/* Subject */}
      {streamId && (
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted))' }}>Subject</label>
          <div className="flex gap-2">
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className={`flex-1 ${sel}`} style={selStyle}>
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <AddButton target="subject" />
          </div>
        </div>
      )}

      {addingTo === 'subject' && (
        <div className="flex gap-2">
          <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New subject name" className={`flex-1 ${sel}`} style={selStyle} />
          <button onClick={handleAddNew} className="btn-3d px-4 text-sm">Add</button>
          <button onClick={() => setAddingTo(null)} style={{ color: 'hsl(var(--muted))' }}><X size={16} /></button>
        </div>
      )}

      {/* Topic */}
      {subjectId && (
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted))' }}>Topic</label>
          <div className="flex gap-2">
            <select value={topicId} onChange={e => setTopicId(e.target.value)} className={`flex-1 ${sel}`} style={selStyle}>
              <option value="">Select topic...</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <AddButton target="topic" />
          </div>
        </div>
      )}

      {addingTo === 'topic' && (
        <div className="flex gap-2">
          <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New topic name" className={`flex-1 ${sel}`} style={selStyle} />
          <button onClick={handleAddNew} className="btn-3d px-4 text-sm">Add</button>
          <button onClick={() => setAddingTo(null)} style={{ color: 'hsl(var(--muted))' }}><X size={16} /></button>
        </div>
      )}

      {/* Sub-topic */}
      {topicId && (
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'hsl(var(--muted))' }}>Sub-topic</label>
          <div className="flex gap-2">
            <select value={subTopicId} onChange={e => setSubTopicId(e.target.value)} className={`flex-1 ${sel}`} style={selStyle}>
              <option value="">Select sub-topic...</option>
              {subTopics.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
            <AddButton target="subtopic" />
          </div>
        </div>
      )}

      {addingTo === 'subtopic' && (
        <div className="flex gap-2">
          <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="New sub-topic name" className={`flex-1 ${sel}`} style={selStyle} />
          <button onClick={handleAddNew} className="btn-3d px-4 text-sm">Add</button>
          <button onClick={() => setAddingTo(null)} style={{ color: 'hsl(var(--muted))' }}><X size={16} /></button>
        </div>
      )}

      {/* Title */}
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Material title"
        className={sel} style={selStyle} />

      {/* Type */}
      <div className="flex gap-2">
        {([
          { t: 'pdf' as const, icon: <FileText size={14} />, label: 'PDF' },
          { t: 'video' as const, icon: <Video size={14} />, label: 'Video' },
          { t: 'pyq' as const, icon: <ClipboardList size={14} />, label: 'PYQ' },
        ]).map(({ t, icon, label }) => (
          <button key={t} onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all"
            style={{ background: type === t ? 'hsl(var(--accent-soft))' : 'transparent', borderColor: type === t ? 'hsl(var(--accent))' : 'hsl(var(--border))', color: type === t ? 'hsl(var(--accent))' : 'hsl(var(--text))' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* URL / File */}
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL (YouTube, Drive, etc.)"
        className={sel} style={selStyle} />
      <div className="text-center text-[10px]" style={{ color: 'hsl(var(--muted))' }}>— or —</div>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.mp4,.mov,.webm" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-xl border-2 border-dashed text-sm transition-all hover:border-accent"
        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}>
        {file ? <span className="flex items-center justify-center gap-1"><FileText size={14} /> {file.name}</span> : 'Click to upload a file'}
      </button>

      <button onClick={handleUpload} disabled={uploading || !title.trim() || !subTopicId}
        className="btn-3d w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
        {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload Resource</>}
      </button>
    </div>
  );
};

export default AdminUpload;
