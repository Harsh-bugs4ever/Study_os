// // src/pages/Auth.tsx
// // ─────────────────────────────────────────────────────────────
// // Gurukul · Login & Sign Up page  (redesigned)
// // Split-screen: particle canvas left | glassmorphism card right
// // Auth powered by Supabase — all existing business logic kept.
// // ─────────────────────────────────────────────────────────────
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '@/integrations/supabase/client';
// import { useApp } from '@/contexts/AppContext';
// import { toast } from 'sonner';

// /* ─────────────────────────────────────────────────────────────
//    INLINE STYLES  (scoped with gk- prefix — won't collide)
// ───────────────────────────────────────────────────────────── */
// const PAGE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display&display=swap');

//   .gk-wrapper *, .gk-wrapper *::before, .gk-wrapper *::after { box-sizing: border-box; }

//   .gk-wrapper {
//     --gk-bg:     #0a0a0a;
//     --gk-panel:  #0f0f0e;
//     --gk-text:   #e8e0d4;
//     --gk-muted:  #a89e8e;
//     --gk-green:  #7aad8a;
//     --gk-greenl: #8fbf9d;
//     --gk-beige:  #c9b99a;
//     --gk-border: rgba(201,185,154,0.15);
//     --gk-ease:   cubic-bezier(0.4,0,0.2,1);
//     display: flex; min-height: 100vh; width: 100%;
//     font-family: 'DM Sans', sans-serif;
//     background: var(--gk-bg); color: var(--gk-text);
//     -webkit-font-smoothing: antialiased;
//   }

//   /* LEFT */
//   .gk-left {
//     position: relative; width: 60%; min-height: 100vh;
//     display: flex; align-items: center; justify-content: center;
//     overflow: hidden; cursor: crosshair;
//   }
//   .gk-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
//   .gk-left::after {
//     content: ''; position: absolute; inset: 0;
//     background: radial-gradient(ellipse at center, transparent 40%, var(--gk-bg) 100%);
//     pointer-events: none; z-index: 1;
//   }
//   .gk-hero { position: relative; z-index: 2; text-align: center; padding: 2rem; max-width: 540px; }
//   .gk-hero-label {
//     font-size: 0.7rem; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
//     color: var(--gk-beige); margin-bottom: 1.5rem; opacity: 0.85;
//   }
//   .gk-hero-headline {
//     font-family: 'DM Serif Display', serif; font-size: 3.25rem; line-height: 1.15;
//     color: var(--gk-text); margin-bottom: 1.25rem;
//   }
//   .gk-hero-subtitle { font-size: 1rem; color: var(--gk-muted); line-height: 1.6; max-width: 400px; margin: 0 auto; }

//   /* RIGHT */
//   .gk-right {
//     position: relative; width: 40%; min-height: 100vh;
//     background: var(--gk-panel);
//     display: flex; align-items: center; justify-content: center;
//     padding: 2rem; overflow-y: auto;
//   }
//   .gk-right::before {
//     content: ''; position: absolute; inset: 0; opacity: 0.03; pointer-events: none; z-index: 0;
//     background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
//     background-size: 128px 128px;
//   }

//   /* CARD */
//   .gk-card {
//     position: relative; z-index: 1; width: 100%; max-width: 380px; padding: 2.5rem;
//     border: 1px solid var(--gk-border); border-radius: 16px; background: rgba(17,17,16,0.6);
//   }
//   .gk-card .gk-r { opacity: 0; transform: translateY(20px); }
//   .gk-card.gk-anim .gk-r { animation: gkFadeUp 0.6s var(--gk-ease) forwards; }
//   @keyframes gkFadeUp { to { opacity: 1; transform: translateY(0); } }
//   .gk-card.gk-anim .gk-r:nth-child(1)  { animation-delay:   0ms; }
//   .gk-card.gk-anim .gk-r:nth-child(2)  { animation-delay:  80ms; }
//   .gk-card.gk-anim .gk-r:nth-child(3)  { animation-delay: 160ms; }
//   .gk-card.gk-anim .gk-r:nth-child(4)  { animation-delay: 240ms; }
//   .gk-card.gk-anim .gk-r:nth-child(5)  { animation-delay: 320ms; }
//   .gk-card.gk-anim .gk-r:nth-child(6)  { animation-delay: 400ms; }
//   .gk-card.gk-anim .gk-r:nth-child(7)  { animation-delay: 480ms; }
//   .gk-card.gk-anim .gk-r:nth-child(8)  { animation-delay: 560ms; }
//   .gk-card.gk-anim .gk-r:nth-child(9)  { animation-delay: 640ms; }
//   .gk-card.gk-anim .gk-r:nth-child(10) { animation-delay: 720ms; }

//   .gk-brand { display:flex; align-items:center; gap:0.6rem; margin-bottom:2rem; }
//   .gk-brand-name { font-family:'DM Serif Display',serif; font-size:1.4rem; color:var(--gk-text); }

//   .gk-heading { font-family:'DM Serif Display',serif; font-size:2rem; color:var(--gk-text); margin-bottom:0.35rem; }
//   .gk-subheading { font-size:0.875rem; color:var(--gk-muted); margin-bottom:1.75rem; }

//   .gk-oauth-group { display:flex; flex-direction:column; gap:0.75rem; }
//   .gk-oauth-btn {
//     display:flex; align-items:center; justify-content:center; gap:0.65rem;
//     width:100%; padding:0.75rem 1.25rem; border-radius:999px; border:1px solid var(--gk-border);
//     font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:500; cursor:pointer; outline:none; position:relative;
//     transition:transform 0.2s var(--gk-ease), box-shadow 0.2s var(--gk-ease), border-color 0.2s var(--gk-ease);
//   }
//   .gk-oauth-btn:hover:not(:disabled) { transform:scale(1.02); border-color:var(--gk-green); box-shadow:0 0 0 3px rgba(122,173,138,0.12); }
//   .gk-oauth-btn:active:not(:disabled) { transform:scale(0.99); }
//   .gk-oauth-btn:disabled { opacity:0.6; cursor:not-allowed; }
//   .gk-google { background:#ffffff; color:#1a1a1a; }
//   .gk-github { background:#1a1a1a; color:var(--gk-text); }
//   .gk-oauth-btn svg { width:18px; height:18px; flex-shrink:0; }

//   .gk-divider { display:flex; align-items:center; gap:1rem; margin:1.5rem 0; }
//   .gk-divider::before,.gk-divider::after { content:''; flex:1; height:1px; background:var(--gk-border); }
//   .gk-divider span { font-size:0.75rem; color:var(--gk-muted); white-space:nowrap; }

//   .gk-field { position:relative; margin-bottom:1.15rem; }
//   .gk-field input {
//     width:100%; padding:1rem;
//     background:rgba(10,10,10,0.6); border:1px solid var(--gk-border); border-radius:10px;
//     color:var(--gk-text); font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none;
//     transition:border-color 0.25s var(--gk-ease), box-shadow 0.25s var(--gk-ease);
//   }
//   .gk-field input::placeholder { color:var(--gk-muted); }
//   .gk-field input:focus { border-color:var(--gk-green); box-shadow:0 0 0 3px rgba(122,173,138,0.15); }
//   .gk-field input:-webkit-autofill,.gk-field input:-webkit-autofill:hover,.gk-field input:-webkit-autofill:focus {
//     -webkit-text-fill-color:var(--gk-text) !important; transition:background-color 5000s ease-in-out 0s;
//   }

//   .gk-pw-toggle {
//     position:absolute; right:0.85rem; top:50%; transform:translateY(-50%);
//     background:none; border:none; cursor:pointer; padding:4px;
//     display:flex; align-items:center; color:var(--gk-muted); transition:color 0.2s var(--gk-ease);
//   }
//   .gk-pw-toggle:hover { color:var(--gk-green); }
//   .gk-pw-toggle svg { width:18px; height:18px; }

//   .gk-forgot { text-align:right; margin-bottom:1.25rem; margin-top:-0.5rem; }
//   .gk-forgot a { font-size:0.75rem; color:var(--gk-muted); cursor:pointer; text-decoration:none; transition:color 0.2s var(--gk-ease); }
//   .gk-forgot a:hover { color:var(--gk-green); text-decoration:underline; }

//   .gk-err { background:rgba(224,128,128,.1); border:1px solid rgba(224,128,128,.25); border-radius:8px; padding:.65rem .85rem; margin-bottom:.85rem; font-size:.8rem; color:#e08080; line-height:1.5; }
//   .gk-ok  { background:rgba(122,173,138,.1); border:1px solid rgba(122,173,138,.25); border-radius:8px; padding:.65rem .85rem; margin-bottom:.85rem; font-size:.8rem; color:var(--gk-green); line-height:1.5; }

//   .gk-cta {
//     width:100%; padding:0.85rem 1rem; border:none; border-radius:999px;
//     background:var(--gk-green); color:var(--gk-bg);
//     font-family:'DM Sans',sans-serif; font-size:0.95rem; font-weight:600;
//     cursor:pointer; outline:none; position:relative;
//     transition:background 0.2s var(--gk-ease), transform 0.2s var(--gk-ease), opacity 0.2s;
//   }
//   .gk-cta:hover:not(:disabled) { background:var(--gk-greenl); transform:scale(1.02); }
//   .gk-cta:active:not(:disabled) { transform:scale(0.99); }
//   .gk-cta:disabled { opacity:0.65; cursor:not-allowed; transform:none; }

//   .gk-toggle { text-align:center; margin-top:1.5rem; font-size:0.8rem; color:var(--gk-muted); }
//   .gk-toggle a { color:var(--gk-green); cursor:pointer; font-weight:500; text-decoration:none; transition:color 0.2s var(--gk-ease); }
//   .gk-toggle a:hover { text-decoration:underline; }

//   @keyframes gkSpin { to { transform:rotate(360deg); } }
//   .gk-spin {
//     display:inline-block; width:14px; height:14px;
//     border:2px solid rgba(10,10,10,.3); border-top-color:#0a0a0a;
//     border-radius:50%; animation:gkSpin .7s linear infinite;
//     vertical-align:middle; margin-right:6px;
//   }

//   @media (max-width: 768px) {
//     .gk-wrapper { flex-direction:column; }
//     .gk-left { width:100%; min-height:220px; height:220px; }
//     .gk-hero-headline { font-size:2rem; }
//     .gk-hero-subtitle { font-size:0.85rem; }
//     .gk-right { width:100%; min-height:auto; padding:1.5rem; }
//     .gk-card { padding:1.5rem; }
//   }
//   @media (max-width: 480px) {
//     .gk-hero-headline { font-size:1.6rem; }
//     .gk-card { max-width:100%; }
//   }
// `;

// /* ─────────────────────────────────────────────────────────────
//    PARTICLE SYSTEM  (vanilla Canvas 2D — zero new dependencies)
// ───────────────────────────────────────────────────────────── */
// function useParticles(
//   panelRef: React.RefObject<HTMLDivElement>,
//   canvasRef: React.RefObject<HTMLCanvasElement>
// ) {
//   useEffect(() => {
//     const panel = panelRef.current;
//     const canvas = canvasRef.current;
//     if (!panel || !canvas) return;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const DPR   = Math.min(window.devicePixelRatio || 1, 2);
//     const COUNT = 900;
//     const COLORS = ['#7aad8a', '#8fbf9d', '#c9b99a', '#a89e8e'];

//     type P = { bx:number; by:number; x:number; y:number; r:number; alpha:number; ph:[number,number]; sp:[number,number]; col:string };
//     const particles: P[] = [];
//     const mouse = { x: -9999, y: -9999, active: false };
//     let W = 0, H = 0;

//     function build() {
//       W = panel!.clientWidth;
//       H = panel!.clientHeight;
//       canvas!.width  = W * DPR;
//       canvas!.height = H * DPR;
//       canvas!.style.width  = W + 'px';
//       canvas!.style.height = H + 'px';
//       ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
//       particles.length = 0;
//       for (let i = 0; i < COUNT; i++) {
//         const bx = (Math.random() - 0.5) * 2;
//         const by = (Math.random() - 0.5) * 2;
//         particles.push({
//           bx, by,
//           x: (bx+1)/2*W,
//           y: (by+1)/2*H,
//           r: 0.8 + Math.random()*1.8,
//           alpha: 0.15 + Math.random()*0.4,
//           ph: [Math.random()*Math.PI*2, Math.random()*Math.PI*2],
//           sp: [0.12+Math.random()*0.3, 0.12+Math.random()*0.3],
//           col: COLORS[Math.floor(Math.random()*COLORS.length)],
//         });
//       }
//     }

//     build();
//     window.addEventListener('resize', build);

//     const REPEL = 120, STR = 90, GLOW_R = 70;
//     let t = 0, raf: number;

//     function hex2(n: number) { return Math.round(n).toString(16).padStart(2,'0'); }

//     function draw() {
//       raf = requestAnimationFrame(draw);
//       t += 0.016;
//       ctx!.clearRect(0, 0, W, H);
//       for (const p of particles) {
//         const bx = (p.bx+1)/2*W + Math.sin(t*p.sp[0]+p.ph[0])*6;
//         const by = (p.by+1)/2*H + Math.cos(t*p.sp[1]+p.ph[1])*6;
//         let tx = bx, ty = by, glow = 0;
//         if (mouse.active) {
//           const dx = bx-mouse.x, dy = by-mouse.y;
//           const d = Math.sqrt(dx*dx+dy*dy);
//           if (d < REPEL && d > 0.5) { const f=(1-d/REPEL)*(1-d/REPEL)*STR; tx+=(dx/d)*f; ty+=(dy/d)*f; }
//           if (d < GLOW_R) glow = Math.pow(1-d/GLOW_R, 2);
//         }
//         const ls = mouse.active ? 0.18 : 0.06;
//         p.x += (tx-p.x)*ls;
//         p.y += (ty-p.y)*ls;
//         const r = p.r*(1+glow*3);
//         const a = Math.min(p.alpha+glow*0.55, 1);
//         if (glow > 0.05) {
//           const g = ctx!.createRadialGradient(p.x,p.y,0,p.x,p.y,r*5);
//           g.addColorStop(0, p.col+hex2(a*0.55*255));
//           g.addColorStop(1,'transparent');
//           ctx!.beginPath(); ctx!.arc(p.x,p.y,r*5,0,Math.PI*2);
//           ctx!.fillStyle = g; ctx!.fill();
//         }
//         ctx!.beginPath(); ctx!.arc(p.x,p.y,r,0,Math.PI*2);
//         ctx!.fillStyle = p.col+hex2(a*255); ctx!.fill();
//       }
//     }
//     draw();

//     const onMove = (e: MouseEvent) => { const r=canvas!.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; mouse.active=true; };
//     const onLeave = () => { mouse.active=false; };
//     panel.addEventListener('mousemove', onMove);
//     panel.addEventListener('mouseleave', onLeave);

//     return () => {
//       cancelAnimationFrame(raf);
//       panel.removeEventListener('mousemove', onMove);
//       panel.removeEventListener('mouseleave', onLeave);
//       window.removeEventListener('resize', build);
//     };
//   }, [panelRef, canvasRef]);
// }

// /* ─────────────────────────────────────────────────────────────
//    PASSWORD INPUT
// ───────────────────────────────────────────────────────────── */
// function PwInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder:string }) {
//   const [show, setShow] = useState(false);
//   return (
//     <div className="gk-field">
//       <input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)}
//         placeholder={placeholder} style={{paddingRight:'2.8rem'}} />
//       <button type="button" className="gk-pw-toggle" onClick={()=>setShow(s=>!s)}>
//         {show ? (
//           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
//             <line x1="1" y1="1" x2="23" y2="23"/>
//           </svg>
//         ) : (
//           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
//           </svg>
//         )}
//       </button>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────────────────────
//    GURUKUL LOGO
// ───────────────────────────────────────────────────────────── */
// function GKLogo() {
//   return (
//     <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
//       <path d="M16 3C16 3 7 10 7 18C7 23.52 11.48 28 16 28C20.52 28 25 23.52 25 18C25 10 16 3 16 3Z" fill="none" stroke="#7aad8a" strokeWidth="1.8"/>
//       <path d="M16 8V22" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
//       <path d="M16 14C18.5 12 21 13 21 15.5C21 18 18.5 18 16 18" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
//       <path d="M16 16C13.5 14 11 15 11 17C11 19 13.5 19 16 19" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round"/>
//       <circle cx="16" cy="8" r="1.5" fill="#7aad8a" opacity="0.8"/>
//     </svg>
//   );
// }

// /* ─────────────────────────────────────────────────────────────
//    MAIN COMPONENT
// ───────────────────────────────────────────────────────────── */
// const Auth = () => {
//   const navigate  = useNavigate();
//   const { setUser } = useApp();
//   const panelRef  = useRef<HTMLDivElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const [isLogin,  setIsLogin]  = useState(true);
//   const [animated, setAnimated] = useState(false);
//   const [name,     setName]     = useState('');
//   const [email,    setEmail]    = useState('');
//   const [password, setPassword] = useState('');
//   const [loading,  setLoading]  = useState(false);
//   const [oLoad,    setOLoad]    = useState<null|'google'|'github'>(null);
//   const [err,      setErr]      = useState('');
//   const [ok,       setOk]       = useState('');

//   useParticles(panelRef, canvasRef);

//   useEffect(() => { const f = requestAnimationFrame(() => setAnimated(true)); return () => cancelAnimationFrame(f); }, []);
//   useEffect(() => { setErr(''); setOk(''); }, [isLogin]);

//   // redirect if already logged in
//   useEffect(() => {
//     let alive = true;
//     void supabase.auth.getSession().then(async ({ data: { session } }) => {
//       if (!session || !alive) return;
//       const { data: p } = await supabase.from('profiles').select('onboarding_complete').eq('id', session.user.id).maybeSingle();
//       if (alive) navigate(p?.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
//     });
//     return () => { alive = false; };
//   }, [navigate]);

//   const loadProfile = useCallback(async (uid: string, mail: string) => {
//     const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
//     if (p) {
//       setUser(prev => ({
//         ...prev,
//         name: p.name || mail.split('@')[0], email: mail,
//         examType: p.exam_type||'', subjects: p.subjects||[],
//         studyTime: p.study_time||'', mood: p.mood||'',
//         xp: p.xp||0, streak: p.streak||0,
//         heroLevel: p.hero_level||1, heroTitle: p.hero_title||'Beginner',
//         burnoutScore: p.burnout_score||0, readinessScore: p.readiness_score||50,
//         onboardingComplete: p.onboarding_complete||false, isLoggedIn: true,
//       }));
//       navigate(p.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
//     } else {
//       setUser(prev => ({ ...prev, name: mail.split('@')[0], email: mail, isLoggedIn: true }));
//       navigate('/onboarding', { replace: true });
//     }
//   }, [navigate, setUser]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault(); setErr(''); setOk('');
//     const norm = email.trim().toLowerCase();
//     if (!norm || !password) { setErr('Please fill in all fields.'); return; }
//     if (!isLogin && !name.trim()) { setErr('Please enter your name.'); return; }
//     setLoading(true);
//     try {
//       if (isLogin) {
//         const { data, error } = await supabase.auth.signInWithPassword({ email: norm, password });
//         if (error) throw error;
//         toast.success('Welcome back!');
//         await loadProfile(data.user.id, norm);
//       } else {
//         const { error } = await supabase.auth.signUp({
//           email: norm, password,
//           options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
//         });
//         if (error) throw error;
//         setOk('Check your email for a verification link!');
//         toast.success('Verification email sent!');
//       }
//     } catch (e: any) { setErr(e.message || 'Authentication failed'); }
//     finally { setLoading(false); }
//   };

//   const handleGoogle = async () => {
//     setErr(''); setOLoad('google');
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'google', options: { redirectTo: `${window.location.origin}/auth` },
//     });
//     setOLoad(null);
//     if (error) { setErr(error.message); toast.error(error.message); }
//   };

//   const handleGithub = async () => {
//     setErr(''); setOLoad('github');
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: 'github', options: { redirectTo: `${window.location.origin}/auth` },
//     });
//     setOLoad(null);
//     if (error) { setErr(error.message); toast.error(error.message); }
//   };

//   const handleForgot = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     const norm = email.trim().toLowerCase();
//     if (!norm) { setErr('Enter your email above first.'); return; }
//     setLoading(true);
//     const { error } = await supabase.auth.resetPasswordForEmail(norm, { redirectTo: `${window.location.origin}/auth` });
//     setLoading(false);
//     if (error) { setErr(error.message); } else { setOk('Password reset email sent! Check your inbox.'); }
//   };

//   const busy = loading || oLoad !== null;

//   return (
//     <>
//       <style>{PAGE_STYLES}</style>
//       <div className="gk-wrapper">

//         {/* LEFT — particles */}
//         <div className="gk-left" ref={panelRef}>
//           <canvas className="gk-canvas" ref={canvasRef} />
//           <div className="gk-hero">
//             <p className="gk-hero-label"><b>Gurukul · IEEE</b></p>
//             <h1 className="gk-hero-headline">Learn Smarter.<br />Feel Better.</h1>
//             <p className="gk-hero-subtitle">Ancient Gurukul wisdom meets modern adaptive learning — built for how students actually think.</p>
//           </div>
//         </div>

//         {/* RIGHT — card */}
//         <div className="gk-right">
//           <div className={`gk-card${animated?' gk-anim':''}`}>

//             <div className="gk-brand gk-r">
//               <GKLogo />
//               <span className="gk-brand-name">Gurukul</span>
//             </div>

//             <h2 className="gk-heading gk-r">{isLogin ? 'Welcome back' : 'Join Gurukul'}</h2>
//             <p className="gk-subheading gk-r">{isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}</p>

//             <div className="gk-oauth-group gk-r">
//               <button className="gk-oauth-btn gk-google" type="button" onClick={handleGoogle} disabled={busy}>
//                 {oLoad==='google' ? <><span className="gk-spin"/>Connecting...</> : <>
//                   <svg viewBox="0 0 24 24">
//                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
//                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
//                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
//                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
//                   </svg>
//                   Continue with Google
//                 </>}
//               </button>
//               <button className="gk-oauth-btn gk-github" type="button" onClick={handleGithub} disabled={busy}>
//                 {oLoad==='github' ? <><span className="gk-spin" style={{borderTopColor:'#e8e0d4'}}/>Connecting...</> : <>
//                   <svg viewBox="0 0 24 24" fill="white">
//                     <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
//                   </svg>
//                   Continue with GitHub
//                 </>}
//               </button>
//             </div>

//             <div className="gk-divider gk-r"><span>or continue with email</span></div>

//             <form onSubmit={handleSubmit} autoComplete="off" noValidate>
//               {!isLogin && (
//                 <div className="gk-field">
//                   <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" />
//                 </div>
//               )}
//               <div className="gk-field">
//                 <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@university.edu" />
//               </div>
//               <PwInput value={password} onChange={setPassword} placeholder={isLogin?'Password':'Password (min 6 chars)'} />

//               {isLogin && (
//                 <div className="gk-forgot gk-r">
//                   <a onClick={handleForgot}>Forgot password?</a>
//                 </div>
//               )}

//               {err && <div className="gk-err">{err}</div>}
//               {ok  && <div className="gk-ok">{ok}</div>}

//               <button type="submit" className="gk-cta gk-r" disabled={busy}>
//                 {loading ? <><span className="gk-spin"/>{isLogin?'Signing in…':'Creating account…'}</> : isLogin?'Sign In':'Create Account'}
//               </button>
//             </form>

//             <p className="gk-toggle gk-r">
//               <span>{isLogin?"Don't have an account? ":"Already have an account? "}</span>
//               <a onClick={()=>{setIsLogin(v=>!v);setErr('');setOk('');setName('');setPassword('');}}>
//                 {isLogin?'Create one':'Sign in'}
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Auth;

// src/pages/Auth.tsx
// ─────────────────────────────────────────────────────────────
// Gurukul · Login & Sign Up page  (redesigned)
// Split-screen: particle canvas left | glassmorphism card right
// Auth powered by Supabase — all existing business logic kept.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────
   INLINE STYLES  (scoped with gk- prefix — won't collide)
───────────────────────────────────────────────────────────── */
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display&display=swap');

  .gk-wrapper *, .gk-wrapper *::before, .gk-wrapper *::after { box-sizing: border-box; }

  .gk-wrapper {
    --gk-bg:     #0a0a0a;
    --gk-panel:  #0f0f0e;
    --gk-text:   #e8e0d4;
    --gk-muted:  #a89e8e;
    --gk-green:  #7aad8a;
    --gk-greenl: #8fbf9d;
    --gk-beige:  #c9b99a;
    --gk-border: rgba(201,185,154,0.15);
    --gk-ease:   cubic-bezier(0.4,0,0.2,1);
    display: flex; min-height: 100vh; width: 100%;
    font-family: 'DM Sans', sans-serif;
    background: var(--gk-bg); color: var(--gk-text);
    -webkit-font-smoothing: antialiased;
  }

  /* LEFT */
  .gk-left {
    position: relative; width: 60%; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; cursor: crosshair;
  }
  .gk-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .gk-left::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, var(--gk-bg) 100%);
    pointer-events: none; z-index: 1;
  }
  .gk-hero { position: relative; z-index: 2; text-align: center; padding: 2rem; max-width: 540px; }
  .gk-hero-label {
    font-size: 0.7rem; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
    color: var(--gk-beige); margin-bottom: 1.5rem; opacity: 0.85;
  }
  .gk-hero-headline {
    font-family: 'DM Serif Display', serif; font-size: 3.25rem; line-height: 1.15;
    color: var(--gk-text); margin-bottom: 1.25rem;
  }
  .gk-hero-subtitle { font-size: 1rem; color: var(--gk-muted); line-height: 1.6; max-width: 400px; margin: 0 auto; }

  /* RIGHT */
  .gk-right {
    position: relative; width: 40%; min-height: 100vh;
    background: var(--gk-panel);
    display: flex; align-items: center; justify-content: center;
    padding: 2rem; overflow-y: auto;
  }
  .gk-right::before {
    content: ''; position: absolute; inset: 0; opacity: 0.03; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }

  /* CARD */
  .gk-card {
    position: relative; z-index: 1; width: 100%; max-width: 380px; padding: 2.5rem;
    border: 1px solid var(--gk-border); border-radius: 16px; background: rgba(17,17,16,0.6);
  }
  .gk-card .gk-r { opacity: 0; transform: translateY(20px); }
  .gk-card.gk-anim .gk-r { animation: gkFadeUp 0.6s var(--gk-ease) forwards; }
  @keyframes gkFadeUp { to { opacity: 1; transform: translateY(0); } }
  .gk-card.gk-anim .gk-r:nth-child(1)  { animation-delay:   0ms; }
  .gk-card.gk-anim .gk-r:nth-child(2)  { animation-delay:  80ms; }
  .gk-card.gk-anim .gk-r:nth-child(3)  { animation-delay: 160ms; }
  .gk-card.gk-anim .gk-r:nth-child(4)  { animation-delay: 240ms; }
  .gk-card.gk-anim .gk-r:nth-child(5)  { animation-delay: 320ms; }
  .gk-card.gk-anim .gk-r:nth-child(6)  { animation-delay: 400ms; }
  .gk-card.gk-anim .gk-r:nth-child(7)  { animation-delay: 480ms; }
  .gk-card.gk-anim .gk-r:nth-child(8)  { animation-delay: 560ms; }
  .gk-card.gk-anim .gk-r:nth-child(9)  { animation-delay: 640ms; }
  .gk-card.gk-anim .gk-r:nth-child(10) { animation-delay: 720ms; }

  .gk-brand { display:flex; align-items:center; gap:0.6rem; margin-bottom:2rem; }
  .gk-brand-name { font-family:'DM Serif Display',serif; font-size:1.4rem; color:var(--gk-text); }

  .gk-heading { font-family:'DM Serif Display',serif; font-size:2rem; color:var(--gk-text); margin-bottom:0.35rem; }
  .gk-subheading { font-size:0.875rem; color:var(--gk-muted); margin-bottom:1.75rem; }

  .gk-oauth-group { display:flex; flex-direction:column; gap:0.75rem; }
  .gk-oauth-btn {
    display:flex; align-items:center; justify-content:center; gap:0.65rem;
    width:100%; padding:0.75rem 1.25rem; border-radius:999px; border:1px solid var(--gk-border);
    font-family:'DM Sans',sans-serif; font-size:0.9rem; font-weight:500; cursor:pointer; outline:none; position:relative;
    transition:transform 0.2s var(--gk-ease), box-shadow 0.2s var(--gk-ease), border-color 0.2s var(--gk-ease);
  }
  .gk-oauth-btn:hover:not(:disabled) { transform:scale(1.02); border-color:var(--gk-green); box-shadow:0 0 0 3px rgba(122,173,138,0.12); }
  .gk-oauth-btn:active:not(:disabled) { transform:scale(0.99); }
  .gk-oauth-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .gk-google { background:#ffffff; color:#1a1a1a; }
  .gk-github { background:#1a1a1a; color:var(--gk-text); }
  .gk-oauth-btn svg { width:18px; height:18px; flex-shrink:0; }

  .gk-divider { display:flex; align-items:center; gap:1rem; margin:1.5rem 0; }
  .gk-divider::before,.gk-divider::after { content:''; flex:1; height:1px; background:var(--gk-border); }
  .gk-divider span { font-size:0.75rem; color:var(--gk-muted); white-space:nowrap; }

  .gk-field { position:relative; margin-bottom:1.15rem; }
  .gk-field input {
    width:100%; padding:1rem;
    background:rgba(10,10,10,0.6); border:1px solid var(--gk-border); border-radius:10px;
    color:var(--gk-text); font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none;
    transition:border-color 0.25s var(--gk-ease), box-shadow 0.25s var(--gk-ease);
  }
  .gk-field input::placeholder { color:var(--gk-muted); }
  .gk-field input:focus { border-color:var(--gk-green); box-shadow:0 0 0 3px rgba(122,173,138,0.15); }
  .gk-field input:-webkit-autofill,.gk-field input:-webkit-autofill:hover,.gk-field input:-webkit-autofill:focus {
    -webkit-text-fill-color:var(--gk-text) !important; transition:background-color 5000s ease-in-out 0s;
  }

  .gk-pw-toggle {
    position:absolute; right:0.85rem; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer; padding:4px;
    display:flex; align-items:center; color:var(--gk-muted); transition:color 0.2s var(--gk-ease);
  }
  .gk-pw-toggle:hover { color:var(--gk-green); }
  .gk-pw-toggle svg { width:18px; height:18px; }

  .gk-forgot { text-align:right; margin-bottom:1.25rem; margin-top:-0.5rem; }
  .gk-forgot a { font-size:0.75rem; color:var(--gk-muted); cursor:pointer; text-decoration:none; transition:color 0.2s var(--gk-ease); }
  .gk-forgot a:hover { color:var(--gk-green); text-decoration:underline; }

  .gk-err { background:rgba(224,128,128,.1); border:1px solid rgba(224,128,128,.25); border-radius:8px; padding:.65rem .85rem; margin-bottom:.85rem; font-size:.8rem; color:#e08080; line-height:1.5; }
  .gk-ok  { background:rgba(122,173,138,.1); border:1px solid rgba(122,173,138,.25); border-radius:8px; padding:.65rem .85rem; margin-bottom:.85rem; font-size:.8rem; color:var(--gk-green); line-height:1.5; }

  .gk-cta {
    width:100%; padding:0.85rem 1rem; border:none; border-radius:999px;
    background:var(--gk-green); color:var(--gk-bg);
    font-family:'DM Sans',sans-serif; font-size:0.95rem; font-weight:600;
    cursor:pointer; outline:none; position:relative;
    transition:background 0.2s var(--gk-ease), transform 0.2s var(--gk-ease), opacity 0.2s;
  }
  .gk-cta:hover:not(:disabled) { background:var(--gk-greenl); transform:scale(1.02); }
  .gk-cta:active:not(:disabled) { transform:scale(0.99); }
  .gk-cta:disabled { opacity:0.65; cursor:not-allowed; transform:none; }

  .gk-toggle { text-align:center; margin-top:1.5rem; font-size:0.8rem; color:var(--gk-muted); }
  .gk-toggle a { color:var(--gk-green); cursor:pointer; font-weight:500; text-decoration:none; transition:color 0.2s var(--gk-ease); }
  .gk-toggle a:hover { text-decoration:underline; }

  @keyframes gkSpin { to { transform:rotate(360deg); } }
  .gk-spin {
    display:inline-block; width:14px; height:14px;
    border:2px solid rgba(10,10,10,.3); border-top-color:#0a0a0a;
    border-radius:50%; animation:gkSpin .7s linear infinite;
    vertical-align:middle; margin-right:6px;
  }

  @media (max-width: 768px) {
    .gk-wrapper { flex-direction:column; }
    .gk-left { width:100%; min-height:220px; height:220px; }
    .gk-hero-headline { font-size:2rem; }
    .gk-hero-subtitle { font-size:0.85rem; }
    .gk-right { width:100%; min-height:auto; padding:1.5rem; }
    .gk-card { padding:1.5rem; }
  }
  @media (max-width: 480px) {
    .gk-hero-headline { font-size:1.6rem; }
    .gk-card { max-width:100%; }
  }
`;

/* ─────────────────────────────────────────────────────────────
   PARTICLE SYSTEM  (vanilla Canvas 2D — zero new dependencies)
───────────────────────────────────────────────────────────── */
function useParticles(
  panelRef: React.RefObject<HTMLDivElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) {
  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const COUNT = 900;
    const COLORS = ['#7aad8a', '#8fbf9d', '#c9b99a', '#a89e8e'];

    type P = { bx: number; by: number; x: number; y: number; r: number; alpha: number; ph: [number, number]; sp: [number, number]; col: string };
    const particles: P[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let W = 0, H = 0;

    function build() {
      W = panel!.clientWidth;
      H = panel!.clientHeight;
      canvas!.width = W * DPR;
      canvas!.height = H * DPR;
      canvas!.style.width = W + 'px';
      canvas!.style.height = H + 'px';
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      particles.length = 0;
      for (let i = 0; i < COUNT; i++) {
        const bx = (Math.random() - 0.5) * 2;
        const by = (Math.random() - 0.5) * 2;
        particles.push({
          bx, by,
          x: (bx + 1) / 2 * W,
          y: (by + 1) / 2 * H,
          r: 0.8 + Math.random() * 1.8,
          alpha: 0.15 + Math.random() * 0.4,
          ph: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
          sp: [0.12 + Math.random() * 0.3, 0.12 + Math.random() * 0.3],
          col: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }

    build();
    window.addEventListener('resize', build);

    const REPEL = 120, STR = 90, GLOW_R = 70;
    let t = 0, raf: number;

    function hex2(n: number) { return Math.round(n).toString(16).padStart(2, '0'); }

    function draw() {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      ctx!.clearRect(0, 0, W, H);
      for (const p of particles) {
        const bx = (p.bx + 1) / 2 * W + Math.sin(t * p.sp[0] + p.ph[0]) * 6;
        const by = (p.by + 1) / 2 * H + Math.cos(t * p.sp[1] + p.ph[1]) * 6;
        let tx = bx, ty = by, glow = 0;
        if (mouse.active) {
          const dx = bx - mouse.x, dy = by - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < REPEL && d > 0.5) { const f = (1 - d / REPEL) * (1 - d / REPEL) * STR; tx += (dx / d) * f; ty += (dy / d) * f; }
          if (d < GLOW_R) glow = Math.pow(1 - d / GLOW_R, 2);
        }
        const ls = mouse.active ? 0.18 : 0.06;
        p.x += (tx - p.x) * ls;
        p.y += (ty - p.y) * ls;
        const r = p.r * (1 + glow * 3);
        const a = Math.min(p.alpha + glow * 0.55, 1);
        if (glow > 0.05) {
          const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          g.addColorStop(0, p.col + hex2(a * 0.55 * 255));
          g.addColorStop(1, 'transparent');
          ctx!.beginPath(); ctx!.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
          ctx!.fillStyle = g; ctx!.fill();
        }
        ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = p.col + hex2(a * 255); ctx!.fill();
      }
    }
    draw();

    const onMove = (e: MouseEvent) => { const r = canvas!.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true; };
    const onLeave = () => { mouse.active = false; };
    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      panel.removeEventListener('mousemove', onMove);
      panel.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', build);
    };
  }, [panelRef, canvasRef]);
}

/* ─────────────────────────────────────────────────────────────
   PASSWORD INPUT
───────────────────────────────────────────────────────────── */
function PwInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="gk-field">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ paddingRight: '2.8rem' }} />
      <button type="button" className="gk-pw-toggle" onClick={() => setShow(s => !s)}>
        {show ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GURUKUL LOGO
───────────────────────────────────────────────────────────── */
function GKLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 3C16 3 7 10 7 18C7 23.52 11.48 28 16 28C20.52 28 25 23.52 25 18C25 10 16 3 16 3Z" fill="none" stroke="#7aad8a" strokeWidth="1.8" />
      <path d="M16 8V22" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 14C18.5 12 21 13 21 15.5C21 18 18.5 18 16 18" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 16C13.5 14 11 15 11 17C11 19 13.5 19 16 19" stroke="#7aad8a" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="1.5" fill="#7aad8a" opacity="0.8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oLoad, setOLoad] = useState<null | 'google' | 'github'>(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useParticles(panelRef, canvasRef);

  useEffect(() => { const f = requestAnimationFrame(() => setAnimated(true)); return () => cancelAnimationFrame(f); }, []);
  useEffect(() => { setErr(''); setOk(''); }, [isLogin]);



  // redirect if already logged in or when auth state changes (e.g. after OAuth redirect)
  useEffect(() => {
    let alive = true;

    const handleSession = async (session: any) => {
      if (!session || !alive) return;
      const { data: p } = await supabase.from('profiles').select('onboarding_complete').eq('id', session.user.id).maybeSingle();
      if (alive) navigate(p?.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
    };

    // Check initial session
    void supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth state changes (critical for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSession(session);
      }
    });

    return () => { 
      alive = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadProfile = useCallback(async (uid: string, mail: string) => {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (p) {
      setUser(prev => ({
        ...prev,
        name: p.name || mail.split('@')[0], email: mail,
        examType: p.exam_type || '', subjects: p.subjects || [],
        studyTime: p.study_time || '', mood: p.mood || '',
        xp: p.xp || 0, streak: p.streak || 0,
        heroLevel: p.hero_level || 1, heroTitle: p.hero_title || 'Beginner',
        burnoutScore: p.burnout_score || 0, readinessScore: p.readiness_score || 50,
        onboardingComplete: p.onboarding_complete || false, isLoggedIn: true,
      }));
      navigate(p.onboarding_complete ? '/dashboard' : '/onboarding', { replace: true });
    } else {
      setUser(prev => ({ ...prev, name: mail.split('@')[0], email: mail, isLoggedIn: true }));
      navigate('/onboarding', { replace: true });
    }
  }, [navigate, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setOk('');
    const norm = email.trim().toLowerCase();
    if (!norm || !password) { setErr('Please fill in all fields.'); return; }
    if (!isLogin && !name.trim()) { setErr('Please enter your name.'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: norm, password });
        if (error) throw error;
        toast.success('Welcome back!');
        await loadProfile(data.user.id, norm);
      } else {
        const { error } = await supabase.auth.signUp({
          email: norm, password,
          options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setOk('Check your email for a verification link!');
        toast.success('Verification email sent!');
      }
    } catch (e: any) { setErr(e.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setErr(''); setOLoad('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: `${window.location.origin}/auth` },
    });
    setOLoad(null);
    if (error) { setErr(error.message); toast.error(error.message); }
  };

  const handleGithub = async () => {
    setErr(''); setOLoad('github');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    setOLoad(null);
    if (error) { setErr(error.message); toast.error(error.message); }
  };

  const handleForgot = async (e: React.MouseEvent) => {
    e.preventDefault();
    const norm = email.trim().toLowerCase();
    if (!norm) { setErr('Enter your email above first.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(norm, { redirectTo: `${window.location.origin}/auth` });
    setLoading(false);
    if (error) { setErr(error.message); } else { setOk('Password reset email sent! Check your inbox.'); }
  };

  const busy = loading || oLoad !== null;

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="gk-wrapper">

        {/* LEFT — particles */}
        <div className="gk-left" ref={panelRef}>
          <canvas className="gk-canvas" ref={canvasRef} />
          <div className="gk-hero">
            <p className="gk-hero-label"><b>Study OS · IEEE</b></p>
            <h1 className="gk-hero-headline">Learn Smarter.<br />Feel Better.</h1>
            <p className="gk-hero-subtitle">Ancient wisdom meets modern adaptive learning — built for how students actually think.</p>
          </div>
        </div>

        {/* RIGHT — card */}
        <div className="gk-right">
          <div className={`gk-card${animated ? ' gk-anim' : ''}`}>

            <div className="gk-brand gk-r">
              <GKLogo />
              <span className="gk-brand-name">Study OS</span>
            </div>

            <h2 className="gk-heading gk-r">{isLogin ? 'Welcome back' : 'Join Study OS'}</h2>
            <p className="gk-subheading gk-r">{isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}</p>

            <div className="gk-oauth-group gk-r">
              <button className="gk-oauth-btn gk-google" type="button" onClick={handleGoogle} disabled={busy}>
                {oLoad === 'google' ? <><span className="gk-spin" />Connecting...</> : <>
                  <svg viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </>}
              </button>
              <button className="gk-oauth-btn gk-github" type="button" onClick={handleGithub} disabled={busy}>
                {oLoad === 'github' ? <><span className="gk-spin" style={{ borderTopColor: '#e8e0d4' }} />Connecting...</> : <>
                  <svg viewBox="0 0 24 24" fill="white">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  Continue with GitHub
                </>}
              </button>
            </div>

            <div className="gk-divider gk-r"><span>or continue with email</span></div>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              {!isLogin && (
                <div className="gk-field">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                </div>
              )}
              <div className="gk-field">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
              </div>
              <PwInput value={password} onChange={setPassword} placeholder={isLogin ? 'Password' : 'Password (min 6 chars)'} />

              {isLogin && (
                <div className="gk-forgot gk-r">
                  <a onClick={handleForgot}>Forgot password?</a>
                </div>
              )}

              {err && <div className="gk-err">{err}</div>}
              {ok && <div className="gk-ok">{ok}</div>}

              <button type="submit" className="gk-cta gk-r" disabled={busy}>
                {loading ? <><span className="gk-spin" />{isLogin ? 'Signing in…' : 'Creating account…'}</> : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="gk-toggle gk-r">
              <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
              <a onClick={() => { setIsLogin(v => !v); setErr(''); setOk(''); setName(''); setPassword(''); }}>
                {isLogin ? 'Create one' : 'Sign in'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;

