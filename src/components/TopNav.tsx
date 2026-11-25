import { Moon, Save, Sun } from 'lucide-react';
import type { TabId } from '../types/productivity';

interface TopNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSave: () => void;
  savedJustNow: boolean;
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan Tomorrow' },
  { id: 'focus', label: 'Focus' },
  { id: 'phone', label: 'Phone' },
  { id: 'review', label: 'Review' },
  { id: 'dashboard', label: 'Dashboard' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  onOpenSave,
  savedJustNow,
}: TopNavProps) {
  return (
    <>
      {/* Single-row 3-zone sticky header (56px height, well under mobile sticky cap) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#today"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('today');
            }}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
          >
            AnchorDesk
          </a>

          {/* Zone 2: Desktop single-line navigation tabs */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-1"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    active
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Save + Light/Dark actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{savedJustNow ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Non-sticky mobile tab bar so sticky chrome stays 56px total on mobile and all 6 tabs are visible */}
      <nav
        aria-label="Mobile sections"
        className="md:hidden border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`min-h-[40px] rounded-lg px-2 py-2 text-xs font-medium text-center transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
