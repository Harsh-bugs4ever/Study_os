import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, Search, FileText, Video, ClipboardList, ExternalLink, FolderOpen } from 'lucide-react';

const AdminResources = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(100);
    setMaterials(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setMaterials(prev => prev.filter(m => m.id !== id));
    toast.success('Deleted');
  };

  const filtered = materials.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeIcon = (t: string) => t === 'pdf' ? <FileText size={14} /> : t === 'video' ? <Video size={14} /> : <ClipboardList size={14} />;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="font-display text-xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
        <FolderOpen size={22} style={{ color: 'hsl(var(--accent))' }} /> Manage Resources
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'hsl(var(--surface2))' }}>
          {['all', 'pdf', 'video', 'pyq'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ background: typeFilter === t ? 'hsl(var(--surface))' : 'transparent', color: typeFilter === t ? 'hsl(var(--text))' : 'hsl(var(--muted))' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: 'hsl(var(--accent))' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 card-base">
          <FolderOpen size={32} className="mx-auto mb-2" style={{ color: 'hsl(var(--muted))' }} />
          <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>No resources found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="card-base flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: m.type === 'pdf' ? 'hsl(var(--danger) / 0.1)' : m.type === 'video' ? 'hsl(var(--accent-soft))' : 'hsl(var(--warning) / 0.1)',
                  color: m.type === 'pdf' ? 'hsl(var(--danger))' : m.type === 'video' ? 'hsl(var(--accent))' : 'hsl(var(--warning))' }}>
                {typeIcon(m.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--text))' }}>{m.title}</p>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                  <span className="uppercase">{m.type}</span>
                  {m.file_size && <span>{m.file_size}</span>}
                  {m.created_at && <span>{new Date(m.created_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <a href={m.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'hsl(var(--accent))' }}>
                <ExternalLink size={14} />
              </a>
              <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/10 transition-all" style={{ color: 'hsl(var(--danger))' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminResources;
