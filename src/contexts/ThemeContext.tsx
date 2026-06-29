import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'paper' | 'forest' | 'dusk';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  recoveryMode: boolean;
  setRecoveryMode: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('saathi-theme') as Theme) || 'paper'
  );
  const [recoveryMode, setRecoveryMode] = useState(false);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('saathi-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-recovery', String(recoveryMode));
  }, [recoveryMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, recoveryMode, setRecoveryMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
