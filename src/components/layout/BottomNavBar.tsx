import { memo } from 'react';
import clsx from 'clsx';

interface BottomNavBarProps {
  activeTab: 'training' | 'plans' | 'create' | 'settings';
  onTrainingClick?: () => void;
  onPlansClick?: () => void;
  onCreateClick?: () => void;
  onSettingsClick?: () => void;
}

export const BottomNavBar = memo(function BottomNavBar({
  activeTab,
  onTrainingClick,
  onPlansClick,
  onCreateClick,
  onSettingsClick,
}: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-background/60 backdrop-blur-xl shadow-[0_-20px_40px_rgba(0,0,0,0.4)] flex justify-around items-center h-24 px-6">
      <button
        type="button"
        data-testid="nav-training"
        onClick={onTrainingClick}
        className={clsx(
          'flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-h-[44px] min-w-[44px] transition-all duration-400',
          {
            'text-primary bg-primary/10': activeTab === 'training',
            'text-tertiary opacity-60 hover:opacity-100 hover:text-primary':
              activeTab !== 'training',
          }
        )}
      >
        <span
          className="material-symbols-outlined mb-1"
          style={{ fontVariationSettings: activeTab === 'training' ? "'FILL' 1" : undefined }}
          aria-hidden
        >
          timer
        </span>
        {activeTab === 'training' && (
          <span className="font-label text-xs font-medium uppercase tracking-widest">Training</span>
        )}
      </button>
      <button
        type="button"
        data-testid="nav-plans"
        onClick={onPlansClick}
        className={clsx(
          'flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-h-[44px] min-w-[44px] transition-all duration-400',
          {
            'text-primary bg-primary/10': activeTab === 'plans',
            'text-tertiary opacity-60 hover:opacity-100 hover:text-primary': activeTab !== 'plans',
          }
        )}
      >
        <span
          className="material-symbols-outlined mb-1"
          style={{ fontVariationSettings: activeTab === 'plans' ? "'FILL' 1" : undefined }}
          aria-hidden
        >
          library_books
        </span>
        {activeTab === 'plans' && (
          <span className="font-label text-xs font-medium uppercase tracking-widest">Plans</span>
        )}
      </button>
      <button
        type="button"
        data-testid="nav-create"
        onClick={onCreateClick}
        className={clsx(
          'flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-h-[44px] min-w-[44px] transition-all duration-400',
          {
            'text-primary bg-primary/10': activeTab === 'create',
            'text-tertiary opacity-60 hover:opacity-100 hover:text-primary': activeTab !== 'create',
          }
        )}
      >
        <span
          className="material-symbols-outlined mb-1"
          style={{ fontVariationSettings: activeTab === 'create' ? "'FILL' 1" : undefined }}
          aria-hidden
        >
          add_circle
        </span>
        {activeTab === 'create' && (
          <span className="font-label text-xs font-medium uppercase tracking-widest">Create</span>
        )}
      </button>
      <button
        type="button"
        onClick={onSettingsClick}
        className={clsx(
          'flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-h-[44px] min-w-[44px] transition-all duration-400',
          {
            'text-primary bg-primary/10': activeTab === 'settings',
            'text-tertiary opacity-60 hover:opacity-100 hover:text-primary':
              activeTab !== 'settings',
          }
        )}
      >
        <span
          className="material-symbols-outlined mb-1"
          style={{ fontVariationSettings: activeTab === 'settings' ? "'FILL' 1" : undefined }}
          aria-hidden
        >
          settings
        </span>
        {activeTab === 'settings' && (
          <span className="font-label text-xs font-medium uppercase tracking-widest">Settings</span>
        )}
      </button>
    </nav>
  );
});
