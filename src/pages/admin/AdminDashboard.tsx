import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, Upload, FolderOpen, BookOpen, LogOut, Shield, Loader2, BarChart3, FileText, Video, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import gurukulLogo from '@/assets/logo.png';

const sidebarItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/upload', icon: Upload, label: 'Upload Resources' },
  { path: '/admin/resources', icon: FolderOpen, label: 'Manage Resources' },
  { path: '/admin/subjects', icon: BookOpen, label: 'Manage Subjects' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ materials: 0, subjects: 0, streams: 0, recent: 0, pdfs: 0, videos: 0, pyqs: 0 });

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin/login'); return; }
      const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
      if (!role) { toast.error('Unauthorized'); await supabase.auth.signOut(); navigate('/admin/login'); return; }
      setIsAdmin(true);

      const [{ count: matCount }, { count: subCount }, { count: strCount }, { data: mats }] = await Promise.all([
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('streams').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('type').order('created_at', { ascending: false }).limit(100),
      ]);
      const pdfs = mats?.filter(m => m.type === 'pdf').length || 0;
      const videos = mats?.filter(m => m.type === 'video').length || 0;
      const pyqs = mats?.filter(m => m.type === 'pyq').length || 0;
      setStats({ materials: matCount || 0, subjects: subCount || 0, streams: strCount || 0, recent: mats?.length || 0, pdfs, videos, pyqs });
    };
    check();
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (isAdmin === null) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--accent))' }} /></div>;

  const isRoot = location.pathname === '/admin/dashboard';

  return (
    <div className="min-h-screen flex" style={{ background: 'hsl(var(--bg))' }}>
      {/* Sidebar */}
      <aside className="w-56 border-r border-border flex flex-col" style={{ background: 'hsl(var(--surface))' }}>
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <div className="w-8 h-8 rounded-xl border flex items-center justify-center" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))' }}>
            <img src={gurukulLogo} alt="" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'hsl(var(--text))' }}>Admin</p>
            <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>Study OS Platform</p>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: active ? 'hsl(var(--accent-soft))' : 'transparent', color: active ? 'hsl(var(--accent))' : 'hsl(var(--muted))' }}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-accent/5"
            style={{ color: 'hsl(var(--danger))' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto">
        {isRoot ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Shield size={24} style={{ color: 'hsl(var(--accent))' }} /> Admin Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>Overview of platform content</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <BarChart3 size={20} />, value: stats.materials, label: 'Total Resources', color: 'hsl(var(--accent))' },
                { icon: <BookOpen size={20} />, value: stats.subjects, label: 'Subjects', color: 'hsl(var(--success))' },
                { icon: <FileText size={20} />, value: stats.pdfs, label: 'PDFs', color: 'hsl(var(--danger))' },
                { icon: <Video size={20} />, value: stats.videos, label: 'Videos', color: 'hsl(var(--warning))' },
              ].map((s, i) => (
                <div key={i} className="card-base text-center py-4">
                  <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
                  <p className="stat-number text-2xl font-bold" style={{ color: 'hsl(var(--text))' }}>{s.value}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/admin/upload" className="card-base flex items-center gap-4 hover:border-accent transition-all cursor-pointer">
                <Upload size={24} style={{ color: 'hsl(var(--accent))' }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text))' }}>Upload Resources</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Add new PDFs, videos, and PYQs</p>
                </div>
              </Link>
              <Link to="/admin/resources" className="card-base flex items-center gap-4 hover:border-accent transition-all cursor-pointer">
                <FolderOpen size={24} style={{ color: 'hsl(var(--accent))' }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'hsl(var(--text))' }}>Manage Resources</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Edit, delete, toggle visibility</p>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
