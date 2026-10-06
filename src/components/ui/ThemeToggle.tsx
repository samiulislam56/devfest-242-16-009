import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { ThemePreference } from '../../types';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem('theme_preference') as ThemePreference;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {}
    return 'system';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t: ThemePreference) => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (t === 'dark' || (t === 'system' && systemDark)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    try {
      localStorage.setItem('theme_preference', theme);
    } catch {}

    // Listen to OS changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [theme]);

  const options: { mode: ThemePreference; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Light' },
    { mode: 'system', icon: <Laptop className="w-3.5 h-3.5" aria-hidden="true" />, label: 'System' },
    { mode: 'dark', icon: <Moon className="w-3.5 h-3.5" aria-hidden="true" />, label: 'Dark' },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center p-1 bg-surface-raised border border-border rounded-lg ${className}`}
    >
      {options.map(opt => (
        <button
          key={opt.mode}
          type="button"
          onClick={() => setTheme(opt.mode)}
          aria-pressed={theme === opt.mode}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            theme === opt.mode
              ? 'bg-surface text-accent shadow-sm font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          title={`Switch to ${opt.label} theme`}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};
