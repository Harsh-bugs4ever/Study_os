import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, BookOpen, Target, Brain, Gamepad2, Users, User, Moon, ArrowLeft, Layers, Library, Menu, X, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import SaathiChatFAB from '@/components/SaathiChatFAB';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import gurukulLogo from '@/assets/gurukul-logo.png';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/quiz', icon: Target, label: 'Quiz' },
  { path: '/revision', icon: Layers, label: 'Revise' },
  { path: '/knowledge-vault', icon: Library, label: 'Vault' },
  { path: '/mental-health', icon: Brain, label: 'Wellness' },
  { path: '/games', icon: Gamepad2, label: 'Games' },
  { path: '/social', icon: Users, label: 'Social' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recoveryMode, setRecoveryMode } = useTheme();
  const { user } = useApp();
  const canGoBack = location.pathname !== '/dashboard';
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar - collapsible */}
      <aside className={`hidden lg:flex flex-col items-center py-6 gap-6 border-r border-border fixed h-full z-40 transition-all duration-300 ${sidebarExpanded ? 'w-48' : 'w-16'}`}
        style={{ background: 'hsl(var(--surface))' }}>
        <Link to="/dashboard" className="block">
          <div className={`flex items-center gap-2 ${sidebarExpanded ? 'px-3' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))' }}>
              <img src={gurukulLogo} alt="Gurukul" className="w-7 h-7 object-contain hover:scale-110 transition-transform" />
            </div>
            {sidebarExpanded && (
              <span className="font-brand text-base font-bold tracking-tight bg-gradient-to-r from-brand-teal to-brand-green bg-clip-text text-transparent">
                Study OS
              </span>
            )}
          </div>
        </Link>

        {/* Toggle button */}
        <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="w-6 h-6 rounded-full flex items-center justify-center absolute -right-3 top-14 border z-50"
          style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted))' }}>
          {sidebarExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        <div className="flex-1 flex flex-col items-start gap-2 mt-4 w-full px-2">
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} title={item.label}
                className={`w-full rounded-xl flex items-center gap-3 transition-all duration-200 relative ${sidebarExpanded ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}`}
                style={{
                  background: active ? 'hsl(var(--accent-soft))' : 'transparent',
                  color: active ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                }}>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'hsl(var(--accent))' }} />}
                <item.icon size={20} className="shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </div>
        <div className={`flex flex-col items-center gap-4 ${sidebarExpanded ? 'w-full px-3' : ''}`}>
          <button onClick={() => setRecoveryMode(!recoveryMode)} title="Recovery Mode"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: recoveryMode ? 'hsl(var(--accent-soft))' : 'transparent', color: recoveryMode ? 'hsl(var(--accent))' : 'hsl(var(--muted))' }}>
            <Moon size={18} />
          </button>
          <ThemeSwitcher />
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 z-40"
        style={{ background: 'hsl(var(--surface))' }}>
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'hsl(var(--muted))' }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border" style={{ background: 'hsl(var(--surface2))', borderColor: 'hsl(var(--border))' }}>
              <img src={gurukulLogo} alt="Gurukul" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-brand text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-brand-teal to-brand-green bg-clip-text text-transparent leading-tight truncate">
                Study OS
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm flex items-center gap-1" style={{ color: 'hsl(var(--warning))' }}>
            <Flame size={14} />
            <span className="stat-number">{user.streak}</span>
          </span>
          <ThemeSwitcher />
          <Link to="/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
            {user.name?.[0] || '?'}
          </Link>
        </div>
      </header>

      <main className={`flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-48' : 'lg:ml-16'}`}>
        {canGoBack && (
          <div className="hidden lg:block px-6 pt-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border transition-all hover:border-accent"
              style={{ color: 'hsl(var(--muted))' }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-border z-40 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        style={{ background: 'hsl(var(--surface))' }}>
        {navItems.slice(0, 5).map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 p-1 transition-colors"
              style={{ color: active ? 'hsl(var(--accent))' : 'hsl(var(--muted))' }}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: 'hsl(var(--accent))' }} />}
            </Link>
          );
        })}
      </nav>

      <SaathiChatFAB />
    </div>
  );
};

export default AppLayout;
