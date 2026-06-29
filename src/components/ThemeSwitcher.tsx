import { useTheme } from '@/contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: 'paper' | 'forest' | 'dusk'; color: string; label: string }[] = [
    { id: 'paper', color: '#F7F4EF', label: 'Paper Light' },
    { id: 'forest', color: '#1A2420', label: 'Forest Calm' },
    { id: 'dusk', color: '#1A1E2E', label: 'Dusk Blue' },
  ];

  return (
    <div className="flex gap-2 items-center">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          className="w-5 h-5 rounded-full border-2 transition-all duration-200"
          style={{
            backgroundColor: t.color,
            borderColor: theme === t.id ? 'hsl(var(--accent))' : 'hsl(var(--border))',
            transform: theme === t.id ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
};

export default ThemeSwitcher;
