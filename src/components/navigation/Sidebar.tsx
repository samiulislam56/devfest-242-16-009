import React from 'react';
import {
  FileText,
  Upload,
  CheckSquare,
  ShieldAlert,
  Package,
  Wrench,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../features/i18n/translations';

export type NavSection = 'overview' | 'requirements' | 'files' | 'validation' | 'package' | 'bonus';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  lang: Language;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  blockingCount: number;
  filesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  lang,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  blockingCount,
  filesCount,
}) => {
  const t = getTranslation(lang);

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: t.navOverview,
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'requirements',
      label: t.navRequirements,
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'files',
      label: t.navFiles,
      icon: <Upload className="w-4 h-4 shrink-0" />,
      badge: filesCount > 0 ? filesCount : undefined,
      badgeColor: 'bg-surface-raised text-text-secondary border border-border',
    },
    {
      id: 'validation',
      label: t.navValidation,
      icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
      badge: blockingCount > 0 ? blockingCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'package',
      label: t.navPackage,
      icon: <Package className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'bonus',
      label: t.navBonus,
      icon: <Wrench className="w-4 h-4 shrink-0" />,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-surface border-r border-border select-none">
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Workflow Navigation
          </span>
        )}
        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised lg:hidden ml-auto"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto" aria-label="Workflow Sections">
        {navItems.map(item => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom status badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                blockingCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-[11px] text-text-secondary font-medium">
              {blockingCount > 0
                ? `${blockingCount} issue${blockingCount > 1 ? 's' : ''} blocking package`
                : 'All requirements satisfied'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block transition-all duration-200 shrink-0 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-[53px] h-[calc(100vh-53px)]">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[80vw] z-50 shadow-xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
