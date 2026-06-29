/**
 * ADMIN LOGIN
 * Single admin account — NO registration.
 * Setup: Create user in Lovable Cloud → Users → Add User (admin@gurukul.com)
 * Then insert into user_roles: { user_id: "<uuid>", role: "admin" }
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, Lock, Mail } from 'lucide-react';
import gurukulLogo from '@/assets/gurukul-logo.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check admin role
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roles) {
        await supabase.auth.signOut();
        toast.error('Unauthorized access — admin only');
        setLoading(false);
        return;
      }

      toast.success('Welcome, Admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bg))' }}>
      <div className="w-full max-w-sm">
        <div className="card-base p-6 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center mb-3" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))' }}>
              <img src={gurukulLogo} alt="Gurukul" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="font-display text-xl font-bold flex items-center justify-center gap-2" style={{ color: 'hsl(var(--text))' }}>
              <Shield size={20} style={{ color: 'hsl(var(--accent))' }} /> Admin Panel
            </h1>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted))' }}>Restricted access — administrators only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted))' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@gurukul.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted))' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none focus:ring-2"
                  style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-3d w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <><Shield size={16} /> Sign In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
