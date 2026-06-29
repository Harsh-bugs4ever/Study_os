import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  name: string;
  email: string;
  examType: string;
  subjects: string[];
  studyTime: string;
  mood: string;
  xp: number;
  streak: number;
  heroLevel: number;
  heroTitle: string;
  burnoutScore: number;
  readinessScore: number;
  onboardingComplete: boolean;
  isLoggedIn: boolean;
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  examType: '',
  subjects: [],
  studyTime: '',
  mood: '',
  xp: 0,
  streak: 0,
  heroLevel: 1,
  heroTitle: 'Beginner',
  burnoutScore: 0,
  readinessScore: 50,
  onboardingComplete: false,
  isLoggedIn: false,
};

interface AppContextType {
  user: UserProfile;
  setUser: (u: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  login: (name: string, email: string) => void;
  logout: () => void;
  syncProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('saathi-user');
      return saved ? JSON.parse(saved) : defaultUser;
    } catch {
      return defaultUser;
    }
  });

  const updateUser = (u: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setUser(prev => {
      const next = typeof u === 'function' ? u(prev) : u;
      localStorage.setItem('saathi-user', JSON.stringify(next));
      return next;
    });
  };

  const login = (name: string, email: string) => {
    updateUser(prev => ({ ...prev, name, email, isLoggedIn: true }));
  };

  const hydrateUserFromSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
    if (!session) return;

    const fallbackName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || '';

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').upsert(
        {
          id: session.user.id,
          name: fallbackName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    const currentProfile = profile ?? {
      name: fallbackName,
      exam_type: '',
      subjects: [],
      study_time: '',
      mood: '',
      xp: 0,
      streak: 0,
      hero_level: 1,
      hero_title: 'Beginner',
      burnout_score: 0,
      readiness_score: 50,
      onboarding_complete: false,
    };

    updateUser(prev => ({
      ...prev,
      name: currentProfile.name || fallbackName,
      email: session.user.email || '',
      examType: currentProfile.exam_type || '',
      subjects: currentProfile.subjects || [],
      studyTime: currentProfile.study_time || '',
      mood: currentProfile.mood || '',
      xp: currentProfile.xp || 0,
      streak: currentProfile.streak || 0,
      heroLevel: currentProfile.hero_level || 1,
      heroTitle: currentProfile.hero_title || 'Beginner',
      burnoutScore: currentProfile.burnout_score || 0,
      readinessScore: currentProfile.readiness_score || 50,
      onboardingComplete: currentProfile.onboarding_complete || false,
      isLoggedIn: true,
    }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('saathi-user');
    setUser(defaultUser);
  };

  // Sync profile to database
  const syncProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !user.isLoggedIn) return;
    
    await supabase.from('profiles').upsert({
      id: session.user.id,
      name: user.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
      exam_type: user.examType,
      subjects: user.subjects,
      study_time: user.studyTime,
      mood: user.mood,
      xp: user.xp,
      streak: user.streak,
      hero_level: user.heroLevel,
      hero_title: user.heroTitle,
      burnout_score: user.burnoutScore,
      readiness_score: user.readinessScore,
      onboarding_complete: user.onboardingComplete,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('saathi-user');
        setUser(defaultUser);
        return;
      }

      void hydrateUserFromSession(session);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void hydrateUserFromSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync profile when key fields change
  useEffect(() => {
    if (user.isLoggedIn && user.onboardingComplete) {
      const timeout = setTimeout(() => {
        void syncProfile();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user.name, user.examType, user.subjects, user.studyTime, user.mood, user.xp, user.streak, user.heroLevel, user.heroTitle, user.burnoutScore, user.readinessScore, user.onboardingComplete, user.isLoggedIn]);

  return (
    <AppContext.Provider value={{ user, setUser: updateUser, login, logout, syncProfile }}>
      {children}
    </AppContext.Provider>
  );
};
