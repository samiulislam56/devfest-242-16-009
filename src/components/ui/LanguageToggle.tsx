import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../../types';

interface LanguageToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLang,
  onLanguageChange,
  className = '',
}) => {
  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-1 bg-surface-raised border border-border rounded-lg ${className}`}
    >
      <div className="pl-1.5 pr-1 text-text-secondary">
        <Languages className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        aria-pressed={currentLang === 'en'}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-surface text-accent shadow-sm font-semibold'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange('bn')}
        aria-pressed={currentLang === 'bn'}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
          currentLang === 'bn'
            ? 'bg-surface text-accent shadow-sm font-semibold'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
