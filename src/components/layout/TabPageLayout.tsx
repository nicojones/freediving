'use client';

import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';

interface TabPageLayoutProps {
  title: string;
  subheader?: string;
  activeTab: 'training' | 'plans' | 'create' | 'settings';
  onTrainingClick: () => void;
  onPlansClick: () => void;
  onCreateClick: () => void;
  onSettingsClick: () => void;
  children: React.ReactNode;
  /** Optional data-testid for the root element */
  'data-testid'?: string;
}

export const TabPageLayout = ({
  title,
  subheader,
  activeTab,
  onTrainingClick,
  onPlansClick,
  onCreateClick,
  onSettingsClick,
  children,
  'data-testid': dataTestId,
}: TabPageLayoutProps) => {
  return (
    <div
      className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden max-sm:px-1!"
      {...(dataTestId && { 'data-testid': dataTestId })}
    >
      <TopAppBar />
      <main className="px-6 pt-8 max-w-2xl mx-auto rounded-3xl transition-all duration-300 content-surface-gradient">
        <section className="mb-12">
          <div className="mb-10">
            <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
              {title}
            </h1>
            {subheader && (
              <p className="text-on-surface-variant font-body text-sm max-w-[80%]">{subheader}</p>
            )}
          </div>
          {children}
        </section>
      </main>
      <BottomNavBar
        activeTab={activeTab}
        onTrainingClick={onTrainingClick}
        onPlansClick={onPlansClick}
        onCreateClick={onCreateClick}
        onSettingsClick={onSettingsClick}
      />
    </div>
  );
};
