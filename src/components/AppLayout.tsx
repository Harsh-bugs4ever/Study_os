import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home, BookOpen, Target, Brain, Gamepad2, Users, User,
  ArrowLeft, Layers, Library, ChevronLeft, ChevronRight,
  Flame, Zap, Bell
} from 'lucide-react';
import SaathiChatFAB from '@/components/SaathiChatFAB';
import { useApp } from '@/contexts/AppContext';
import gurukulLogo from '@/assets/logo.png';

/* ── StudyOS design tokens (mirrored from index.css) ── */
const T = {
  bg:           '#F1EFE8',
  card:         '#FFFFFF',
  textPrimary:  '#2C2C2A',
  textSec:      '#5F5E5A',
  textMuted:    '#888780',
  border:       '#D3D1C7',
  borderStrong: '#85B7EB',
  primary:      '#185FA5',
  primaryTint:  '#E6F1FB',
  warning:      '#BA7517',
};

const navItems = [
  { path: '/dashboard',      icon: Home,      label: 'Home'     },
  { path: '/learn',          icon: BookOpen,  label: 'Learn'    },
  { path: '/quiz',           icon: Target,    label: 'Quiz'     },
  { path: '/revision',       icon: Layers,    label: 'Revise'   },
  { path: '/knowledge-vault',icon: Library,   label: 'Vault'    },
  { path: '/mental-health',  icon: Brain,     label: 'Wellness' },
  { path: '/games',          icon: Gamepad2,  label: 'Games'    },
  { path: '/social',         icon: Users,     label: 'Social'   },
  { path: '/profile',        icon: User,      label: 'Profile'  },
];

const AppLayout = () => {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user }   = useApp();
  const canGoBack  = location.pathname !== '/dashboard';
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.bg }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: expanded ? 192 : 64,
        background: T.card,
        borderRight: `0.5px solid ${T.border}`,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        gap: 0,
        zIndex: 40,
        transition: 'width 0.25s ease',
      }}
        className="lg-sidebar"
      >
        {/* Brand */}
        <Link to="/dashboard" style={{
          display: 'flex', alignItems: 'center',
          gap: 10, padding: '0 12px 20px',
          width: '100%', textDecoration: 'none',
          borderBottom: `0.5px solid ${T.border}`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: T.primaryTint,
            border: `0.5px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src={gurukulLogo} alt="Study OS" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          {expanded && (
            <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
              Study OS
            </span>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            position: 'absolute', right: -12, top: 52,
            width: 24, height: 24, borderRadius: '50%',
            background: T.card, border: `0.5px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.textMuted, zIndex: 50,
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
        >
          {expanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Nav items */}
        <div style={{ flex: 1, width: '100%', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!expanded ? item.label : undefined}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: expanded ? '9px 12px' : '9px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: 8,
                  textDecoration: 'none',
                  background: active ? T.primaryTint : 'transparent',
                  color: active ? T.primary : T.textMuted,
                  transition: 'background 0.15s ease, color 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = '#F5F4F0';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Active left indicator */}
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 16, borderRadius: '0 99px 99px 0',
                    background: T.primary,
                  }} />
                )}
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {expanded && (
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User avatar */}
        {expanded ? (
          <div style={{
            width: '100%', padding: '12px 12px 0',
            borderTop: `0.5px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: T.primaryTint, color: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}>
              {user?.name?.[0] || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Student'}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Free plan</div>
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 12, borderTop: `0.5px solid ${T.border}`, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: T.primaryTint, color: T.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
            }}>
              {user?.name?.[0] || '?'}
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 56, background: T.card,
        borderBottom: `0.5px solid ${T.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 40,
      }}
        className="mobile-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canGoBack && (
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.textMuted,
              }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: T.primaryTint, border: `0.5px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={gurukulLogo} alt="Study OS" style={{ width: 18, height: 18, objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, letterSpacing: '-0.2px' }}>
              Study OS
            </span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: T.warning }}>
            <Flame size={13} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{user?.streak ?? 0}</span>
          </span>
          <Link to="/profile" style={{
            width: 30, height: 30, borderRadius: '50%',
            background: T.primaryTint, color: T.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, textDecoration: 'none',
          }}>
            {user?.name?.[0] || '?'}
          </Link>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        paddingTop: 56,             /* mobile top bar height */
        paddingBottom: 72,          /* mobile bottom nav */
        minHeight: '100vh',
      }}
        className="app-main"
      >
        {canGoBack && (
          <div className="back-btn-desktop" style={{ padding: '16px 24px 0' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8,
                border: `0.5px solid ${T.border}`,
                background: T.card, color: T.textMuted,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.borderStrong}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
            >
              <ArrowLeft size={13} /> Back
            </button>
          </div>
        )}
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64,
        background: T.card,
        borderTop: `0.5px solid ${T.border}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 4px',
        zIndex: 40,
      }}
        className="mobile-bottom-nav"
      >
        {navItems.slice(0, 5).map(item => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 8px',
                color: active ? T.primary : T.textMuted,
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
            >
              <item.icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{item.label}</span>
              {active && (
                <div style={{ width: 16, height: 2, borderRadius: 99, background: T.primary, marginTop: 1 }} />
              )}
            </Link>
          );
        })}
      </nav>

      <SaathiChatFAB />

      {/* ── Responsive styles injected via <style> ──────────────── */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .app-main {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin-left: ${expanded ? '192px' : '64px'};
          }
          .back-btn-desktop { display: block; }
        }
        @media (max-width: 1023px) {
          .back-btn-desktop { display: none; }
          .lg-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AppLayout;
