import React from 'react';
import { Menu, FileCheck, Layers } from 'lucide-react';
import { Language } from '../../types';
import { LanguageToggle } from '../ui/LanguageToggle';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ThreeDLayer } from '../ui/ThreeDLayer';
import { getTranslation } from '../../features/i18n/translations';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onToggleSidebar?: () => void;
  tenderId?: string;
  matchedCount: number;
  totalRequirements: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onToggleSidebar,
  tenderId,
  matchedCount,
  totalRequirements,
}) => {
  const t = getTranslation(currentLang);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 py-2.5 bg-surface/90 backdrop-blur border-b border-border transition-colors">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <ThreeDLayer className="w-8 h-8 hidden sm:flex" />
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent sm:hidden">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-text-primary leading-tight">
                {t.appTitle}
              </h1>
              {tenderId && (
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-subtle text-accent border border-accent/20">
                  {tenderId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-secondary hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Progress pill */}
        {totalRequirements > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-surface-raised border border-border text-text-secondary font-medium">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>
              {matchedCount}/{totalRequirements} {t.matchedDocs}
            </span>
          </div>
        )}

        {/* Language switch */}
        <LanguageToggle currentLang={currentLang} onLanguageChange={onLanguageChange} />

        {/* Theme switch */}
        <ThemeToggle />
      </div>
    </header>
  );
};
